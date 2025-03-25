import axios from "axios";
import { Domain, LandingPage, Language } from "../interfaces";

export type ResponseGetLandingPageService = (LandingPage | undefined) & {
  domain: Domain;
};
export async function GetLandingPageService(input: {
  domain: string;
  language: Language;
  route?: string;
}): Promise<ResponseGetLandingPageService> {
  try {
    const landingPage = await axios.get(
      process.env.NEXT_PUBLIC_NODE_ENV === "development"
        ? "http://localhost:3001/public/landing-page/get"
        : "https://backend-landingpage-admin-dasboard-n2vkrqhb2a-uc.a.run.app/public/landing-page/get",
      {
        params: { ...input },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return landingPage.data;
  } catch (err) {
    console.log(err);
    throw err.response.data;
  }
}
