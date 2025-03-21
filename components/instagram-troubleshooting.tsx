import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function InstagramTroubleshooting() {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Instagram Connection Troubleshooting</AlertTitle>
        <AlertDescription>
          If you're having trouble connecting your Instagram account, check the solutions below.
        </AlertDescription>
      </Alert>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="business-account">
          <AccordionTrigger>I don't have an Instagram Business account</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">
              Instagram's API only supports Business accounts for content publishing. To convert your account:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Open Instagram app and go to your profile</li>
              <li>Tap the hamburger menu (≡) and select Settings</li>
              <li>Tap Account, then scroll to "Switch to Professional Account"</li>
              <li>Select "Business" as your account type</li>
              <li>Connect to a Facebook Page (create one if needed)</li>
              <li>Complete the setup process</li>
            </ol>
            <p className="mt-2 text-sm text-muted-foreground">
              Note: Your Instagram Business account must be connected to a Facebook Page to use the API.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="facebook-page">
          <AccordionTrigger>I don't have a Facebook Page</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">You need a Facebook Page to use Instagram's API. To create one:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Go to{" "}
                <a
                  href="https://www.facebook.com/pages/create"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  facebook.com/pages/create
                </a>
              </li>
              <li>Select "Business or Brand"</li>
              <li>Enter a Page name and category</li>
              <li>Follow the setup steps</li>
              <li>Once created, connect your Instagram Business account to this Page</li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="permissions">
          <AccordionTrigger>I'm getting permission errors</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">Make sure you grant all required permissions during the connection process:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>instagram_basic</li>
              <li>instagram_content_publish</li>
              <li>pages_read_engagement</li>
              <li>pages_show_list</li>
              <li>business_management</li>
            </ul>
            <p className="mt-2">
              If you declined permissions, try connecting again and accept all permission requests.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="app-review">
          <AccordionTrigger>Do I need to submit my app for review?</AccordionTrigger>
          <AccordionContent>
            <p>
              For personal use or development, you don't need to submit your app for review. You can use the API with
              your own Instagram Business account without review. However, if you want to publish to other users'
              accounts, you'll need to submit your app for review by Facebook.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="token-expired">
          <AccordionTrigger>My connection keeps disconnecting</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">
              This might be due to token expiration. Instagram access tokens typically expire after 60 days. Try:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Disconnecting your account</li>
              <li>Reconnecting your Instagram account</li>
              <li>Ensuring your Facebook and Instagram accounts are in good standing</li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

