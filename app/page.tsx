"use client";

import { useState } from "react";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Qrcode from "react-qr-code";
import { useLocalStorage } from "@/components/useLocalStorage";
import { toast } from "sonner";
import Confetti from "react-confetti";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

// Provider configuration
const PROVIDERS: Record<
  string,
  { id: string; name: string; description: string }
> = {
  GmailAccount: {
    id: "f9f383fd-32d9-4c54-942f-5e9fda349762",
    name: "Gmail Account",
    description: "Verify your Gmail Account",
  },
  githubRepositories: {
    id: "9779c1df-2342-4bbd-8df1-3ca8cbcd6d46",
    name: "GitHub Repositories",
    description: "Verify your GitHub repositories",
  },
  githubContribution: {
    id: "8573efb4-4529-47d3-80da-eaa7384dac19",
    name: "GitHub Contribution",
    description: "Verify your GitHub Contribution",
  },
  codeforcesContribution: {
    id: "9ec0e38d-3d97-4a3f-a816-efbf2270e2dc",
    name: "CodeForces Contribution",
    description: "Verify your CodeForces Contribution",
  },
  stackoverflow: {
    id: "9640cb3e-6a1a-43cc-8447-812b676d917f",
    name: "Stack Overflow Reputation",
    description: "Verify your Stack Overflow reputation and badges",
  },
};

const APP_CONFIG = {
  appId: process.env.NEXT_PUBLIC_APP_ID,
  appSecret: process.env.NEXT_PUBLIC_APP_SECRET,
};

const styles = StyleSheet.create({
  page: {
    textAlign: "center",
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
    fontFamily: "Times-Roman",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 18,
    margin: 12,
    fontWeight: 600,
  },
  text: {
    margin: 12,
    fontSize: 14,
    fontWeight: 500,
    textAlign: "center",
  },
});

export default function MultiStepReclaimVerification() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [qr, setQR] = useState<string>("");
  const [verified, setVerified] = useState("none");
  const [status, setStatus] = useState<{ [key: string]: string }>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setItem } = useLocalStorage();

  const providerKeys = Object.keys(PROVIDERS);
  const currentProvider =
    PROVIDERS[providerKeys[currentStep] as keyof typeof PROVIDERS];

  const initializeProvider = async (providerId: string) => {
    try {
      const reclaimProofRequest = await ReclaimProofRequest.init(
        APP_CONFIG.appId!,
        APP_CONFIG.appSecret!,
        providerId,
        { log: true, acceptAiProviders: true }
      );

      const requestUrl = await reclaimProofRequest.getRequestUrl();
      console.log(requestUrl);

      setQR(requestUrl);
      setVerified("verifying");

      await reclaimProofRequest.startSession({
        onSuccess: (proofs) => {
          setVerified("verified");
          console.log(JSON.parse(proofs.claimData.context));
          setStatus({ ...status, [providerId]: "verified" });
          setItem(
            currentProvider.name,
            JSON.parse(proofs.claimData.context).extractedParameters
          );
          toast.info(`Proof for ${currentProvider.name} generated`);
          setTimeout(() => {
            setQR("");
            if (currentStep === 4) {
              setCurrentStep(0);
              return;
            }
            handleNext();
          }, 2000);
        },
        /* @ts-expect-error  unknown error*/
        onFailure: (error) => {
          setVerified("none");
          console.log(error);
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleVerify = () => {
    initializeProvider(currentProvider.id);
  };

  const handleNext = () => {
    setQR("");
    setVerified("none");
    if (currentStep < providerKeys.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setQR("");
    setVerified("none");
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleButtonClick = async () => {
    setShowConfetti(true);
    setLoading(true);

    // Wait for 3 seconds to simulate confetti
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Generate PDF blob and initiate download
    const blob = await pdf(<MyDocument />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resume.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Clean up confetti and reset loading state
    setShowConfetti(false);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Alert
        variant="default"
        className="my-2 border-green-400 font-bold tracking-wide"
      >
        <InfoCircledIcon className="h-6 w-5" />
        <AlertTitle className="text-xl tracking-wider">Attention</AlertTitle>
        <AlertDescription className="">
          If provider is not able to extract the data, then scan the QR AGAIN to
          Re-start the process
        </AlertDescription>
      </Alert>
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{currentProvider.name}</h3>
            <p className="text-sm text-gray-500">
              {currentProvider.description}
            </p>
          </div>
          <Badge
            variant={verified === "verified" ? "default" : "secondary"}
            className="ml-2"
          >
            {verified}
          </Badge>
        </CardHeader>
        <CardContent>
          {verified === "none" ? (
            <Button onClick={handleVerify} className="w-full">
              Start Verification
            </Button>
          ) : verified === "verifying" ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Verifying...</span>
              <Button
                className="mx-1"
                variant={"destructive"}
                onClick={() => {
                  setVerified("none");
                  setQR("");
                }}
              >
                Cancel{" "}
              </Button>
            </div>
          ) : verified === "verified" ? (
            <div className="bg-gray-50 p-4 rounded">
              <pre className="text-sm overflow-auto">Verified</pre>
            </div>
          ) : (
            <div className="text-red-500">
              {`Error: "Some un-expected error has occured"`}
            </div>
          )}
        </CardContent>

        <CardContent className="">
          <div className="flex justify-center ">
            {qr && <Qrcode value={qr} />}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handlePrevious} disabled={currentStep === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentStep === providerKeys.length - 1}
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {Object.keys(status).length === Object.keys(PROVIDERS).length && (
        <Card className="mt-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Generated Verified Resume</h2>
          </CardHeader>
          <CardContent>
            <Button
              className="bg-green-300 font-semibold"
              onClick={handleButtonClick}
              disabled={loading}
              variant={"outline"}
            >
              {loading ? "Preparing PDF..." : "Download Resume"}
            </Button>
          </CardContent>
        </Card>
      )}
      {showConfetti && <Confetti />}
    </div>
  );
}

const MyDocument = () => {
  const { getItem } = useLocalStorage();
  const gmail = getItem("Gmail Account");
  const reposData = getItem("GitHub Repositories");
  const contributiondData = getItem("GitHub Contribution");
  const codeforcesData = getItem("CodeForces Contribution");
  const stackOverflowData = getItem("Stack Overflow Reputation");

  /*   console.table([
    [{ Name: contributiondData.URL_PARAMS_1 }],
    [{ Gmail: gmail.email }],
    [
      {
        "Total repositories (from last year) ": reposData[0].value,
      },
    ],
    [
      {
        "Total cotribution (from last year) ": Number(
          contributiondData.contributions
        ),
      },
    ],
    [{ "Codeforces Contribution": codeforcesData.count }],
    [{ "Stack Overflow Reputation": Number(stackOverflowData.reputation) }],
  ]); */

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Verified Resume using Reclaim zktls</Text>

        <Text style={styles.subtitle}>
          Extracted verified data using various RECLAIM PROVIDERS
        </Text>
        <View>
          <Text style={styles.text}>
            1. Name : {contributiondData.URL_PARAMS_1}
          </Text>

          <Text style={styles.text}>2. Gmail : {gmail.email}</Text>

          <Text style={styles.text}>
            3. TotalContribution (from last year) :{" "}
            {Number(contributiondData.contributions)}
          </Text>

          <Text style={styles.text}>
            4. Total repositories : {reposData.slice(25, 27)}
          </Text>

          <Text style={styles.text}>
            5. Codeforces Contribution : {codeforcesData.count}
          </Text>

          <Text style={styles.text}>
            6. Stack-Overflow Rating : {Number(stackOverflowData.reputation)}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
