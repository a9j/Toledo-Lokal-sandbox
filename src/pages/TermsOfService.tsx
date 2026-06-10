import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';

export default function TermsOfService() {
  return (
    <>
      <Header title="Terms of Service" showBack />
      <PageContainer className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
        <p className="text-xs text-muted-foreground">Last updated: June 9, 2026</p>

        <p>
          These Terms of Service ("Terms") govern your use of the Toledo Lokal mobile app and website (the "Service"),
          operated by Loop Lokal. By using the Service, you agree to these Terms. If you do not agree, do not use the
          Service.
        </p>

        <h2 className="font-display">Eligibility</h2>
        <p>
          You must be at least 13 years old to use the Service. If you register a business, you confirm you are
          authorized to act on behalf of that business.
        </p>

        <h2 className="font-display">Your Account</h2>
        <p>
          You are responsible for keeping your login credentials secure and for all activity under your account. We may
          suspend or terminate accounts that violate these Terms.
        </p>

        <h2 className="font-display">Acceptable Use</h2>
        <p>
          You agree not to post false, misleading, unlawful, or harmful content, impersonate another person or business,
          misuse the Loop Lokal rewards program including fraudulent check-ins or point manipulation, attempt to disrupt
          or reverse engineer the Service, or use the Service to violate any law or the rights of others.
        </p>

        <h2 className="font-display">Business Listings and Content</h2>
        <p>
          If you register a business or post content, you are responsible for its accuracy and for having the right to
          share it. You grant us a license to display that content within the Service. We do not guarantee the accuracy
          of business listings, hours, deals, or events.
        </p>

        <h2 className="font-display">Loop Lokal Rewards</h2>
        <p>
          Loop Lokal points and rewards have no cash value and are not transferable except as allowed in the Service. We
          may change, limit, or end the rewards program at any time. Points may expire as described in the program rules.
        </p>

        <h2 className="font-display">Payments and Subscriptions</h2>
        <p>
          Some features require payment or a subscription. Payments are processed by Stripe. Subscriptions renew
          automatically unless canceled before the renewal date. Fees are non-refundable except where required by law.
        </p>

        <h2 className="font-display">Disclaimers</h2>
        <p>
          The Service is provided "as is" and "as available." We do not warrant that it will be uninterrupted,
          error-free, or that listings will be accurate.
        </p>

        <h2 className="font-display">Limitation of Liability</h2>
        <p>
          To the fullest extent allowed by law, Loop Lokal will not be liable for indirect, incidental, special, or
          consequential damages. Our total liability for any claim will not exceed the amount you paid us in the twelve
          months before the claim.
        </p>

        <h2 className="font-display">Governing Law</h2>
        <p>
          These Terms are governed by the laws of the State of Ohio. Disputes will be handled in the courts located in
          Toledo, Lucas County, Ohio.
        </p>

        <h2 className="font-display">Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. We will post the updated version in the app with a new "Last
          updated" date.
        </p>

        <h2 className="font-display">Contact Us</h2>
        <p>Loop Lokal, Hello@toledolokal.com</p>
      </PageContainer>
    </>
  );
}
