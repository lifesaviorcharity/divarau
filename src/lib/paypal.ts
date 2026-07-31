function getPayPalConfig() {
  const clientId = (process.env.PAYPAL_CLIENT_ID || "").trim();
  const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || "").trim();
  const rawMode = process.env.PAYPAL_ENVIRONMENT || process.env.PAYPAL_MODE || "sandbox";
  const mode = rawMode.trim().toLowerCase();

  const base = (mode === "live" || mode === "production")
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

  return { clientId, clientSecret, mode, base };
}

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 */
export async function generateAccessToken(): Promise<string> {
  const { clientId, clientSecret, base } = getPayPalConfig();

  if (!clientId || !clientSecret) {
    throw new Error("MISSING_API_CREDENTIALS: PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is missing.");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    cache: "no-store",
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to generate Access Token: ${data.error_description || response.statusText}`);
  }
  
  return data.access_token;
}

/**
 * Create an order to start the transaction.
 */
export async function createOrder(amount: number, description: string, returnUrl: string, cancelUrl: string) {
  const { base } = getPayPalConfig();
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;

  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        description: description,
        amount: {
          currency_code: "AUD",
          value: amount.toFixed(2),
        },
      },
    ],
    application_context: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
    },
  };

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  return handleResponse(response);
}

/**
 * Capture payment for the created order to complete the transaction.
 */
export async function capturePayment(orderId: string) {
  const { base } = getPayPalConfig();
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderId}/capture`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  return handleResponse(response);
}

async function handleResponse(response: Response) {
  if (response.status === 200 || response.status === 201) {
    return response.json();
  }

  const errorText = await response.text();
  try {
    const errorJson = JSON.parse(errorText);
    const issueDetail = errorJson.details?.[0]?.description || errorJson.details?.[0]?.issue;
    const message = issueDetail ? `${errorJson.name || 'PayPal Error'}: ${issueDetail}` : (errorJson.message || errorText);
    throw new Error(message);
  } catch (e: any) {
    if (e.message && e.message !== errorText && !e.message.startsWith("Unexpected token")) {
      throw e;
    }
    throw new Error(errorText);
  }
}

