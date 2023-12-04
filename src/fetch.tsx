import axios, { AxiosResponse } from "axios";

// Main function to fetch data from the specified URL and process it
export const fetch = async (jrctNumber: string): Promise<AxiosResponse> => {
  const isNodeEnvironment: boolean =
    typeof process !== "undefined" && process.release.name === "node";

  const serverEndpoint: string =
    !isNodeEnvironment && window.location.hostname === "localhost"
      ? //? `http://localhost:3001/get-jrct-data?jrctNumber=${jrctNumber}`
        `https://jrct.niph.go.jp/latest-detail/${jrctNumber}`
      : `https://jrct.niph.go.jp/latest-detail/${jrctNumber}`;
  try {
    console.log("Fetching data from:", serverEndpoint);
    const response = await axios.get(serverEndpoint, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      withCredentials: true,
    });
    return response;
  } catch (error: any) {
    console.error("エラー:", error.message);
    throw error;
  }
};
