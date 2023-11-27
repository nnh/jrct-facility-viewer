import React, { useState, ChangeEvent } from "react";
import { fetchDataAndProcess } from "./createFacilityList";
import { AxiosError } from "axios";

const ScriptRunner: React.FC = () => {
  const [arg1, setArg1] = useState<string>(""); // 引数を保持するstate
  const [result, setResult] = useState<Map<string, string[][] | string> | null>(
    null
  ); // 結果を保持するstate

  const runScript = async (): Promise<void> => {
    try {
      // 半角数字9桁でない場合は処理を中断
      if (!/^\d{9}$/.test(arg1)) {
        console.error("Error: jRCT番号は半角数字9桁で入力してください。");
        setResult(null);
        return;
      }
      const response = await fetchDataAndProcess(arg1);
      setResult(response);
    } catch (error: any) {
      console.error("Error running script:", error);
      setResult(null);
      if (error instanceof AxiosError) {
        alert("スクリプトの実行中にエラーが発生しました: " + error.message);
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const input = e.target.value;
    if (/^\d*$/.test(input)) {
      // 半角数字のみを許可する正規表現
      setArg1(input);
    }
  };
  const title: string = result ? (result.get("title") as string) : "";
  const table: string[][] | null = result
    ? (result.get("table") as string[][])
    : null;
  const columnIndex: [string, number][] = [
    ["県名", 3],
    ["施設名", 1],
    ["所属部署", 2],
    ["氏名", 0],
  ];

  return (
    <div>
      <label>
        jRCT番号を半角数字で入力してください:jRCTs
        <input type="text" value={arg1} onChange={handleInputChange} />
      </label>
      <button onClick={runScript}>スクリプト実行</button>

      {result !== null && (
        <div>
          <h2>{title}</h2>
          <table style={{ border: "1px solid black" }}>
            <thead>
              <tr>
                {columnIndex.map(([text, _]) => (
                  <th key={text} style={{ border: "1px solid black" }}>
                    {text}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table &&
                table.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex} style={{ border: "1px solid black" }}>
                    {columnIndex.map(([_, index]) => (
                      <td key={index} style={{ border: "1px solid black" }}>
                        {row[index]}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScriptRunner;
