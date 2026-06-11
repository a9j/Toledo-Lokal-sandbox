import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';

export default function PrivacyPolicy() {
  return (
    <>
      <Header title="Privacy Policy" showBack />
      <PageContainer className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
        <p className="text-xs text-muted-foreground">Last updated: June 10, 2026</p>

        <p>
          Toledo Lokal is operated by MyMomentous LLC ("we," "us," or "our"). This Privacy Policy explains what
          information we collect when you use the Toledo Lokal website and mobile app (together, the "Platform"), how we
          use it, and the choices you have.
        </p>
        <p>
          If you have any questions, contact us at{' '}
          <a href="mailto:anthony@toledolokal.com" className="text-primary hover:underline">
            anthony@toledolokal.com
          </a>
          .
        </p>

        <h2 className="font-display">Who We Are</h2>
        <p>
          Toledo Lokal is a community platform for the Toledo metro area that connects residents with local businesses,
          food trucks, nonprofits, events, and jobs. The Platform is operated by MyMomentous LLC.
        </p>

        <h2 className="font-display">Information We Collect</h2>
        <p>
          <strong>Account information.</strong> When you create an account, we collect information such as your name and
          email address so we can identify you, secure your account, and communicate with you. Authentication and account
          data are handled through our backend provider, Supabase.
        </p>
        <p>
          <strong>Content you provide.</strong> If you post to community features, save favorites, follow businesses, or
          submit information through the Platform, we store that content so the Platform can function as intended.
        </p>
        <p>
          <strong>Business and partner information.</strong> If you represent a business, nonprofit, or organization, we
          collect the information you provide to create and manage your listing or profile.
        </p>
        <p>
          <strong>Location information.</strong> Our app includes a "near me" feature that, with your permission, uses
          your device's location to show you nearby businesses, food trucks, events, and other local content. You control
          this through your device settings, and you can deny or turn off location access at any time without losing
          access to the rest of the Platform. We use your location only to power this feature and do not use it to track
          you across other apps or services.
        </p>
        <p>
          <strong>Technical information.</strong> Like most online services, our systems automatically receive basic
          technical information (such as device type and general app performance data) needed to deliver and maintain the
          Platform.
        </p>
        <p>
          We do <strong>not</strong> collect payment card information through the app. Any paid partnership or membership
          transactions are handled separately and outside the consumer app experience.
        </p>

        <h2 className="font-display">How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Create and secure your account</li>
          <li>Operate, maintain, and improve the Platform</li>
          <li>Display business listings, events, jobs, and community content</li>
          <li>Show you nearby local content when you use the "near me" feature and grant location access</li>
          <li>Respond to your questions and provide support</li>
          <li>Communicate with you about the Platform and your account</li>
        </ul>

        <h2 className="font-display">How We Share Your Information</h2>
        <p>
          We do not sell your personal information. We share information only in these limited situations:
        </p>
        <ul>
          <li>
            <strong>Service providers.</strong> We use trusted providers (such as Supabase for backend and
            authentication, and Vercel for hosting) that process data on our behalf to operate the Platform.
          </li>
          <li>
            <strong>Public content.</strong> Information you choose to make public (such as a business profile or a
            community post) is visible to other users by design.
          </li>
          <li>
            <strong>Legal reasons.</strong> We may disclose information if required by law or to protect the rights,
            safety, or property of our users or the public.
          </li>
        </ul>

        <h2 className="font-display">Data Retention</h2>
        <p>
          We keep your information for as long as your account is active or as needed to provide the Platform. You may
          request deletion of your account and associated personal information at any time by contacting us at{' '}
          <a href="mailto:anthony@toledolokal.com" className="text-primary hover:underline">
            anthony@toledolokal.com
          </a>
          .
        </p>

        <h2 className="font-display">Your Choices and Rights</h2>
        <p>You can:</p>
        <ul>
          <li>Access or update your account information within the Platform</li>
          <li>Request deletion of your account and personal data</li>
          <li>Contact us with any privacy questions or requests</li>
        </ul>
        <p>
          To exercise any of these, email{' '}
          <a href="mailto:anthony@toledolokal.com" className="text-primary hover:underline">
            anthony@toledolokal.com
          </a>
          .
        </p>

        <h2 className="font-display">Children's Privacy</h2>
        <p>
          The Platform is not directed to children under 13, and we do not knowingly collect personal information from
          children under 13. If you believe a child has provided us with personal information, contact us and we will
          delete it.
        </p>

        <h2 className="font-display">Security</h2>
        <p>
          We take reasonable measures to protect your information. No method of transmission or storage is completely
          secure, but we work to safeguard your data through our service providers and security practices.
        </p>

        <h2 className="font-display">Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date above.
          Continued use of the Platform after changes means you accept the updated policy.
        </p>

        <h2 className="font-display">Contact Us</h2>
        <p>
          MyMomentous LLC
          <br />
          Toledo Lokal
          <br />
          Email:{' '}
          <a href="mailto:anthony@toledolokal.com" className="text-primary hover:underline">
            anthony@toledolokal.com
          </a>
        </p>
      </PageContainer>
    </>
  );
}
