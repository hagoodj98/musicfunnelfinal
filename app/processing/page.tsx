import { Suspense } from "react";
import ProcessingContent from "./processing-content";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProcessingContent />
    </Suspense>
  );
}

//This page is just for testing the email confirmation endpoint. I want to make sure that when the user confirms their email, the GET request to this endpoint works and redirects the user to /landing. So I have this useEffect that makes a request to the email-confirmation endpoint. If everything works, then when I click the confirmation link in the email, I should see the data from that endpoint in the console and get redirected to /landing. If there is an error, then I will see that error in the console instead.
