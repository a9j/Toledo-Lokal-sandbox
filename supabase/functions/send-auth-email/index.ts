import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// Set this from the Supabase dashboard: Auth → Hooks → Send Email Hook.
// Supabase signs every hook request with this secret (format: "v1,whsec_...").
const SEND_EMAIL_HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
// Fallback domain used to build verify links when the payload omits one.
const SITE_URL = (Deno.env.get("SITE_URL") || "https://toledolokal.com").replace(/\/$/, "");

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ToledoLokal <noreply@toledolokal.com>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return response.json();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Payload shape Supabase sends to a "Send Email" auth hook.
interface SendEmailHookPayload {
  user: { email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url?: string;
  };
}

// Map Supabase's email_action_type values onto our template keys.
const templateKeyFor = (actionType: string): string => {
  switch (actionType) {
    case "signup":
      return "signup";
    case "recovery":
      return "recovery";
    case "magiclink":
    case "reauthentication":
      return "magic_link";
    case "email_change":
    case "email_change_new":
    case "email_change_current":
      return "email_change";
    default:
      return actionType;
  }
};

const getEmailContent = (type: string, confirmUrl: string, token?: string) => {
  switch (type) {
    case "signup":
      return {
        subject: "Welcome to ToledoLokal - Confirm your email",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">ToledoLokal</h1>
              <p style="color: #666; margin-top: 5px;">Your daily local guide</p>
            </div>
            
            <h2 style="color: #1f2937;">Welcome to the community!</h2>
            
            <p>Thanks for signing up for ToledoLokal. Please confirm your email address to get started:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Confirm Email</a>
            </div>
            
            ${token ? `<p style="color: #666; font-size: 14px;">Or use this code: <strong>${token}</strong></p>` : ""}
            
            <p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} ToledoLokal. Discover what's happening in Toledo.
            </p>
          </body>
          </html>
        `,
      };

    case "recovery":
      return {
        subject: "Reset your ToledoLokal password",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">ToledoLokal</h1>
            </div>
            
            <h2 style="color: #1f2937;">Reset your password</h2>
            
            <p>We received a request to reset your password. Click the button below to choose a new one:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>
            
            ${token ? `<p style="color: #666; font-size: 14px;">Or use this code: <strong>${token}</strong></p>` : ""}
            
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} ToledoLokal
            </p>
          </body>
          </html>
        `,
      };

    case "magic_link":
      return {
        subject: "Your ToledoLokal login link",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">ToledoLokal</h1>
            </div>
            
            <h2 style="color: #1f2937;">Sign in to ToledoLokal</h2>
            
            <p>Click the button below to sign in to your account:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Sign In</a>
            </div>
            
            ${token ? `<p style="color: #666; font-size: 14px;">Or use this code: <strong>${token}</strong></p>` : ""}
            
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} ToledoLokal
            </p>
          </body>
          </html>
        `,
      };

    case "email_change":
      return {
        subject: "Confirm your new email - ToledoLokal",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">ToledoLokal</h1>
            </div>
            
            <h2 style="color: #1f2937;">Confirm your new email</h2>
            
            <p>Click the button below to confirm your new email address:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Confirm Email</a>
            </div>
            
            ${token ? `<p style="color: #666; font-size: 14px;">Or use this code: <strong>${token}</strong></p>` : ""}
            
            <p style="color: #666; font-size: 14px;">If you didn't request this change, please contact support immediately.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} ToledoLokal
            </p>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: "ToledoLokal",
        html: `<p>Click <a href="${confirmUrl}">here</a> to continue.</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-auth-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();

    // Verify the request really came from Supabase Auth. The hook secret is
    // required — without it we'd be an open relay that emails arbitrary links.
    if (!SEND_EMAIL_HOOK_SECRET) {
      throw new Error("SEND_EMAIL_HOOK_SECRET is not configured");
    }
    const wh = new Webhook(SEND_EMAIL_HOOK_SECRET.replace(/^v1,whsec_/, ""));
    const headers = Object.fromEntries(req.headers);
    const payload = wh.verify(rawBody, headers) as SendEmailHookPayload;

    const email = payload.user?.email;
    const {
      token,
      token_hash,
      redirect_to,
      email_action_type,
      site_url,
    } = payload.email_data ?? {};

    if (!email || !email_action_type) {
      throw new Error("Malformed hook payload: missing email or action type");
    }

    console.log(`Processing ${email_action_type} email for ${email}`);

    // Build the Supabase verify URL. Clicking it confirms the action and then
    // bounces the user to redirect_to (which must be on the allowlist), or to
    // our canonical site URL as a fallback — never a raw deployment host.
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const baseRedirect = redirect_to || site_url || SITE_URL;
    const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(baseRedirect)}`;

    const { subject, html } = getEmailContent(
      templateKeyFor(email_action_type),
      confirmUrl,
      token,
    );

    console.log(`Sending ${email_action_type} email to ${email} via Resend`);

    const emailResponse = await sendEmail(email, subject, html);

    console.log("Email sent successfully:", emailResponse);

    // The Send Email Hook expects an empty 200 body on success.
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in send-auth-email function:", error);
    // Returning an error object tells Supabase Auth the email wasn't sent.
    return new Response(
      JSON.stringify({ error: { http_code: 500, message } }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
