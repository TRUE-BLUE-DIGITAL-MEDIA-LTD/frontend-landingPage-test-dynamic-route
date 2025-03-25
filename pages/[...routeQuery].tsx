import { GetServerSideProps } from "next";
import React, { useEffect } from "react";
import requestIp from "request-ip";
import { Language } from "../interfaces";
import {
  GetLandingPageService,
  ResponseGetLandingPageService,
} from "../services/landingPage";
import { GoogleAnalytics } from "nextjs-google-analytics";
import * as crypto from "crypto";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import { DirectLinkService } from "../services/merchant";
import { CreateEmailService } from "../services/email";
import Head from "next/head";
import { event } from "nextjs-google-analytics";

function Index({
  landingPage,
  errorMessage,
  country,
}: {
  landingPage: ResponseGetLandingPageService;
  errorMessage?: string;
  country: string;
}) {
  const router = useRouter();
  const mainLink = landingPage?.mainButton;
  console.log("country", country);
  const preventDefaultForSubmitButtons = () => {
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    const emailInput: HTMLInputElement = document.querySelector(
      'input[type="email"][name="email"]'
    );
    const NameInput: HTMLInputElement = document.querySelector(
      'input[type="text"][name="name"]'
    );

    const anchorTags = document.querySelectorAll("a");
    anchorTags.forEach((button) => {
      let href = button.href;

      if (href === window.location.href) {
        href = mainLink;
      }
      button.addEventListener("click", function (e) {
        event("click", {
          category: "button-click",
          label: href,
        });
        router.push(href);
        e.preventDefault();
      });
    });

    submitButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        event("click", {
          category: "button-click",
          label: mainLink,
        });
        e.preventDefault();
        const email = emailInput?.value;
        const name = NameInput?.value;
        handleSumitEmail({ email, name });
      });
    });
  };
  useEffect(() => {
    // const body = document.getElementById("u_body");
    // if (body) {
    //   body.style.display = "flex";
    //   body.style.alignItems = "center";
    //   body.style.justifyContent = "center";
    //   body.style.gap = "0.75rem";
    // } else {
    //   console.log('Element with id "u_body" not found.');
    // }

    preventDefaultForSubmitButtons();
  }, []);

  const handleSumitEmail = async ({ email, name }) => {
    try {
      Swal.fire({
        title: "Thanks For Joining us",
        html: "Loading....",
        allowEscapeKey: false,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      if (landingPage.directLink) {
        const [directLink, collectEmail] = await Promise.allSettled([
          DirectLinkService({
            email: email,
            url: landingPage.directLink,
          }),
          CreateEmailService({
            email: email,
            landingPageId: landingPage?.id,
            name,
          }),
        ]);
        Swal.fire({
          title: "Success",
          text: "You have been successfully registered",
          icon: "success",
        });

        if (directLink.status === "rejected") {
          router.push(mainLink);
        } else if (directLink.value.status === "success") {
          router.push(directLink.value.location);
        }
      } else {
        window.open(mainLink, "_self");
      }
    } catch (err) {
      console.log("run", err);
      window.open(mainLink), "_self";
    }
  };
  console.log("errorMessage", errorMessage);
  if (errorMessage) {
    return (
      <div className="w-screen h-screen bg-black font-Anuphan">
        <div className="flex p-10 justify-center text-center  text-white items-center w-full h-full">
          <h1 className="text-base lg:text-3xl font-bold">{errorMessage}</h1>
        </div>
      </div>
    );
  }

  if (country === "Thailand") {
    return (
      <div
        className="w-screen h-screen bg-black font-semibold text-center
       font-Poppins text-white flex justify-center items-center text-lg md:text-2xl"
      >
        Our service is not available in your country.
      </div>
    );
  }
  if (!landingPage.id) {
    return (
      <div className="w-screen h-screen bg-black font-Anuphan">
        <div className="flex p-10 justify-center text-center  text-white items-center w-full h-full">
          <h1 className="text-base lg:text-3xl font-bold">
            This domain {landingPage.domain.name} has no landing page
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div>
      <GoogleAnalytics
        trackPageViews
        nonce={crypto.randomBytes(16).toString("base64")}
        gaMeasurementId={landingPage?.domain?.googleAnalyticsId}
      />

      <Head>
        <meta name="description" content={landingPage.description} />
        {/* facebook sharing link */}
        <meta property="og:title" content={landingPage.title} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={landingPage.description} />
        <meta property="og:image" content={landingPage.backgroundImage} />
        <meta property="og:url" content="https://bestDatingSite.com" />

        {/* tweeter sharing link */}
        <meta name="twitter:title" content={landingPage.title} />
        <meta name="twitter:type" content="website" />
        <meta name="twitter:description" content={landingPage.description} />
        <meta name="twitter:image" content={landingPage.backgroundImage} />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="shortcut icon" href={landingPage.icon} />
        <title>{landingPage.title}</title>
      </Head>
      <main dangerouslySetInnerHTML={{ __html: `${landingPage.html}` }} />
    </div>
  );
}

export default Index;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  let host = ctx.req.headers.host;
  let country = "United States";
  try {
    const userIP = requestIp.getClientIp(ctx.req);
    console.log("userIP", userIP);
    const countryResponse = await fetch(`http://ip-api.com/json/${userIP}`);
    const response = await countryResponse?.json();
    console.log("response", response);
    if (response?.country) {
      country = response?.country;
    }
  } catch (error) {
    console.log("error", error);
  }

  if (process.env.NEXT_PUBLIC_NODE_ENV === "development") {
    host = "localhost:8181";
  } else {
    host = ctx.req.headers.host;
  }
  const acceptLanguage = ctx.req.headers["accept-language"];
  let userLanguage: Language = acceptLanguage
    ? (acceptLanguage.split(",")[0] as Language)
    : ("en" as Language);
  userLanguage = userLanguage?.split("-")[0] as Language;
  console.log("userLanguage", userLanguage);

  try {
    const landingPage = await GetLandingPageService({
      domain: host,
      language: userLanguage,
      route: ctx.resolvedUrl,
    });
    return {
      props: {
        landingPage: landingPage,
        country,
      },
    };
  } catch (error) {
    console.log("error", error);
    return {
      props: {
        errorMessage: error.message,
      },
    };
  }
};
