import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

interface AuthEmailRequest {
  email: string;
  type: "signup" | "recovery" | "magic_link" | "email_change";
  token?: string;
  tokenHash?: string;
  redirectTo?: string;
  newEmail?: string;
}

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
    const { email, type, token, tokenHash, redirectTo }: AuthEmailRequest = await req.json();

    console.log(`Processing ${type} email for ${email}`);

    // Validate required fields
    if (!email || !type) {
      throw new Error("Missing required fields: email and type");
    }

    // Build confirmation URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const baseRedirect = redirectTo || "https://toledolokal.com";
    
    let confirmUrl = "";
    if (tokenHash) {
      confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=${type}&redirect_to=${encodeURIComponent(baseRedirect)}`;
    } else if (token) {
      confirmUrl = `${baseRedirect}?token=${token}&type=${type}`;
    } else {
      confirmUrl = baseRedirect;
    }

    const { subject, html } = getEmailContent(type, confirmUrl, token);

    console.log(`Sending ${type} email to ${email} via Resend`);

    const emailResponse = await sendEmail(email, subject, html);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
