import * as cheerio from "cheerio";
import { fetch } from "./fetch";
import { AxiosResponse } from "axios";
import { jsonToMapByPrefectureName } from "./getPrefecture";

// Constants
const NAME = "Name";
const AFFILIATION = "Affiliation";
const DEPARTMENT = "所属部署";
const ADDRESS = "所属機関の住所";
const PREFECTURE_COLUMN_INDEX = 4;
const SORTORDER_MAP_PREFECTURE = jsonToMapByPrefectureName();

const getTitle = ($: cheerio.Root): string => {
  const TITLE_SELECTOR = "div.jr-caption";
  let titleText = ""; // 初期値を空文字列に設定
  $(TITLE_SELECTOR).each((_, targetSelector) => {
    $(targetSelector)
      .find("tr")
      .each((_, tr) => {
        if ($(tr).find("th").find("label").text() === "研究名称") {
          titleText = $(tr).find("td").text(); // 条件がtrueの場合、titleTextに値を設定
          return false; // falseを返してeachループを終了
        }
      });
    if (titleText) return false; // titleTextが設定された場合、外側のeachループも終了
  });
  return titleText; // titleTextを返す
};

const getParsedData = ($: cheerio.Root): string[][] => {
  const TARGET_SELECTOR = "#area-toggle-01-04";
  const TARGET_TH_LIST = new Set([NAME, AFFILIATION, DEPARTMENT, ADDRESS]);
  const extractedValues: string[][] = [];

  $(TARGET_SELECTOR).each((_, targetSelector) => {
    $(targetSelector)
      .find("table")
      .each((_, table) => {
        const values = getTargetValuesFromTable($, table, TARGET_TH_LIST);
        if (values.length > 0) {
          extractedValues.push(values);
        }
      });
  });
  const sortedValues = sortExtractedValues(extractedValues);
  return sortedValues;
};

const sortExtractedValues = (extractedValues: string[][]): string[][] => {
  const sortedValues: (number | string)[][] = extractedValues
    .map((row) => {
      const sortedRow: (number | string)[] = [...row];
      sortedRow[PREFECTURE_COLUMN_INDEX] = !isNaN(
        Number(sortedRow[PREFECTURE_COLUMN_INDEX])
      )
        ? Number(sortedRow[PREFECTURE_COLUMN_INDEX])
        : -99;
      return sortedRow;
    })
    .sort((a, b) => {
      return (
        Number(a[PREFECTURE_COLUMN_INDEX]) - Number(b[PREFECTURE_COLUMN_INDEX])
      );
    });
  const resValues: string[][] = sortedValues.map((row) =>
    row.map((cell) => (typeof cell !== "string" ? cell.toString() : cell))
  );
  return resValues;
};

// Function to get text content based on table header and table data
const getTableCellText = (
  header: string,
  cell: cheerio.Cheerio
): string | null => {
  return header === NAME || header === AFFILIATION
    ? cell.eq(0).text()
    : header === DEPARTMENT
    ? cell.text()
    : header === ADDRESS
    ? cell.text().split(/[\s\u3000\t]+/)[0]
    : null;
};

// Function to extract values from the HTML table based on the defined headers
const getTargetValuesFromTable = (
  $: cheerio.Root,
  table: cheerio.Element,
  targetTH: Set<string>
): string[] => {
  const results: string[] = [];
  const rows = $(table).find("tr");
  rows.each((_, row) => {
    const labels = $(row).find("th").find("label");
    labels.each((_, label) => {
      const header = $(label).text();
      if (targetTH.has(header)) {
        const cellText = getTableCellText(header, $(row).find("td"));
        if (cellText !== null) {
          results.push(cellText);
          if (header === ADDRESS) {
            const sortorder: string = SORTORDER_MAP_PREFECTURE.has(cellText)
              ? (SORTORDER_MAP_PREFECTURE.get(cellText) as string)
              : "-1";
            results.push(sortorder);
          }
        }
      }
    });
  });
  return results;
};

// Main processing
export const fetchDataAndProcess = async (
  jrctNumber: string
): Promise<Map<string, string[][] | string>> => {
  try {
    const response: AxiosResponse<string> = await fetch(`jRCTs${jrctNumber}`);
    if (!response || response.data.length === 0) {
      console.error("Please check the jRCT number and run the process again.");
      throw new Error("No data available");
    }
    const $: cheerio.Root = cheerio.load(response.data);
    const title: string = getTitle($);
    const parsedData: string[][] = getParsedData($);
    const result = new Map<string, string[][] | string>();
    result.set("title", title);
    result.set("table", parsedData);
    return result;
  } catch (error: any) {
    console.error("Error fetching and processing data:", error.message);
    throw error;
  }
};
