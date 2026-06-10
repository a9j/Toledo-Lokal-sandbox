import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';

export default function PrivacyPolicy() {
  return (
    <>
      <Header title="Privacy Policy" showBack />
      <PageContainer className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
        <p className="text-xs text-muted-foreground">Last updated: June 9, 2026</p>

        <p>
          This Privacy Policy explains how Loop Lokal ("Toledo Lokal," "we," "us," or "our") collects, uses, and
          protects your information when you use the Toledo Lokal mobile app and website (the "Service"). By using the
          Service, you agree to the collection and use of information as described in this policy.
        </p>

        <h2 className="font-display">Information We Collect</h2>
        <p>
          <strong>Account information.</strong> When you create an account, we collect your name, email address, and any
          profile details you choose to add, such as a photo, neighborhood, or interests.
        </p>
        <p>
          <strong>Business information.</strong> If you register a business, we collect business details you provide,
          including business name, address, hours, contact information, photos, and category.
        </p>
        <p>
          <strong>Location information.</strong> With your permission, we collect location data to show you nearby
          businesses, events, and food trucks. You can control location access in your device settings. Some features,
          such as the map and "Near Me," may not work without it.
        </p>
        <p>
          <strong>Usage information.</strong> We collect information about how you use the Service, including check-ins,
          Loop Points activity, saved places, posts, and interactions with businesses.
        </p>
        <p>
          <strong>Payment information.</strong> When you make a purchase or subscribe, payments are processed by our
          payment provider, Stripe. We do not store your full card details.
        </p>
        <p>
          <strong>Device information.</strong> We collect basic technical information such as device type, operating
          system, and app version to keep the Service working and secure.
        </p>

        <h2 className="font-display">How We Use Your Information</h2>
        <p>
          We use your information to create and manage your account, show you relevant local businesses, events, and
          offers, operate the Loop Lokal rewards program, process payments and subscriptions, communicate with you about
          the Service, improve and secure the Service, and comply with legal obligations.
        </p>

        <h2 className="font-display">How We Share Your Information</h2>
        <p>
          We do not sell your personal information. We share information only with businesses you interact with (such as
          when you check in or redeem a reward), with service providers who help us operate the Service under agreements
          that protect your information, and for legal reasons if required by law or to protect users or the public.
        </p>

        <h2 className="font-display">Your Choices</h2>
        <p>
          You can update your profile information at any time in the app, disable location access in your device
          settings, request deletion of your account by contacting us at Hello@toledolokal.com, and opt out of
          non-essential emails using the unsubscribe link.
        </p>

        <h2 className="font-display">Data Retention</h2>
        <p>
          We keep your information for as long as your account is active or as needed to provide the Service. When you
          delete your account, we delete or anonymize your personal information, except where we must keep it for legal
          or legitimate business reasons.
        </p>

        <h2 className="font-display">Children's Privacy</h2>
        <p>
          The Service is not intended for children under 13, and we do not knowingly collect information from children
          under 13. If you believe a child has provided us information, contact us at Hello@toledolokal.com and we will
          delete it.
        </p>

        <h2 className="font-display">Security</h2>
        <p>
          We use reasonable technical and organizational measures to protect your information. No method of transmission
          or storage is completely secure, so we cannot guarantee absolute security.
        </p>

        <h2 className="font-display">Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the updated version in the app with a new
          "Last updated" date.
        </p>

        <h2 className="font-display">Contact Us</h2>
        <p>Loop Lokal, Hello@toledolokal.com, Toledo, Ohio</p>
      </PageContainer>
    </>
  );
}
