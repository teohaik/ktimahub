"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { E9ParsedField } from "@/app/api/e9/parse/route";

type Step = "upload" | "processing" | "review" | "importing" | "done";

interface ReviewField extends E9ParsedField {
  included: boolean;
  editedName: string;
}

interface ImportWizardProps {
  locale: string;
}

const CULTIVATION_COLORS: Record<string, string> = {
  ANNUAL: "bg-yellow-100 text-yellow-800",
  PERENNIAL: "bg-purple-100 text-purple-800",
  OLIVE: "bg-green-100 text-green-800",
  OTHER_TREES: "bg-teal-100 text-teal-800",
  PASTURE: "bg-orange-100 text-orange-800",
  FOREST: "bg-emerald-100 text-emerald-800",
  OTHER: "bg-gray-100 text-gray-700",
};

export default function ImportWizard({ locale }: ImportWizardProps) {
  const t = useTranslations("e9Import");
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<ReviewField[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError(t("errorParsing"));
      return;
    }
    setError("");
    setStep("processing");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/e9/parse", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? t("errorParsing"));
        setStep("upload");
        return;
      }

      if (!data.fields || data.fields.length === 0) {
        setError(t("noFieldsFound"));
        setStep("upload");
        return;
      }

      setFields(
        data.fields.map((f: E9ParsedField) => ({
          ...f,
          included: true,
          editedName: f.name,
        }))
      );
      setStep("review");
    } catch {
      setError(t("errorParsing"));
      setStep("upload");
    }
  }, [t]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const selectedFields = fields.filter((f) => f.included);

  const toggleAll = (include: boolean) => {
    setFields((prev) => prev.map((f) => ({ ...f, included: include })));
  };

  const handleImport = async () => {
    setStep("importing");
    try {
      const res = await fetch("/api/e9/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: selectedFields.map((f) => ({ ...f, name: f.editedName })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        setStep("review");
        return;
      }
      setImportedCount(data.count);
      setStep("done");
    } catch {
      setError("Import failed");
      setStep("review");
    }
  };

  const reset = () => {
    setStep("upload");
    setFields([]);
    setError("");
    setImportedCount(0);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Step indicator */}
      <StepIndicator step={step} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Step 1: Upload */}
        {(step === "upload" || step === "processing") && (
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("step1Title")}</h2>
            <p className="text-sm text-gray-500 mb-8 max-w-2xl">{t("step1Desc")}</p>

            {step === "upload" && (
              <>
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    dragging
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50"
                  }`}
                >
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileInput} />
                  <UploadIcon />
                  <p className="mt-3 text-sm font-medium text-gray-700">{t("dropOrClick")}</p>
                  <p className="mt-1 text-xs text-gray-400">{t("fileRequirement")}</p>
                </label>

                {error && (
                  <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    <ErrorIcon />
                    {error}
                  </div>
                )}
              </>
            )}

            {step === "processing" && (
              <div className="flex flex-col items-center justify-center h-52 gap-4">
                <Spinner />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">{t("analyzing")}</p>
                  <p className="text-xs text-gray-400 mt-1">{t("analyzingDesc")}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === "review" && (
          <div className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t("step3Title")}</h2>
                <p className="text-sm text-gray-500 mt-1">{t("step3Desc")}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleAll(true)}
                  className="text-xs text-green-700 hover:text-green-900 underline"
                >
                  {t("selectAll")}
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => toggleAll(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  {t("deselectAll")}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                <ErrorIcon />
                {error}
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">{t("colInclude")}</th>
                    <th className="px-4 py-3 text-left">{t("colName")}</th>
                    <th className="px-4 py-3 text-left">{t("colKaek")}</th>
                    <th className="px-4 py-3 text-right">{t("colArea")}</th>
                    <th className="px-4 py-3 text-left">{t("colType")}</th>
                    <th className="px-4 py-3 text-right">{t("colOwnership")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fields.map((field, i) => (
                    <tr
                      key={i}
                      className={field.included ? "bg-white" : "bg-gray-50 opacity-50"}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={field.included}
                          onChange={(e) =>
                            setFields((prev) =>
                              prev.map((f, j) => j === i ? { ...f, included: e.target.checked } : f)
                            )
                          }
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={field.editedName}
                          onChange={(e) =>
                            setFields((prev) =>
                              prev.map((f, j) => j === i ? { ...f, editedName: e.target.value } : f)
                            )
                          }
                          disabled={!field.included}
                          className="w-full min-w-[160px] border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-transparent disabled:border-transparent"
                        />
                        <p className="text-xs text-gray-400 mt-0.5">{field.municipality} · {field.prefecture}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                        {field.kaek}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {field.officialArea.toLocaleString("el-GR")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CULTIVATION_COLORS[field.cultivationType]}`}>
                          {t(field.cultivationType as Parameters<typeof t>[0])}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {field.ownershipPercentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
              <p className="text-sm text-gray-500">
                {t("selected", { count: selectedFields.length })}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t("step1Title")}
                </button>
                <button
                  onClick={handleImport}
                  disabled={selectedFields.length === 0}
                  className="px-5 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t("importSelected", { count: selectedFields.length })}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Importing */}
        {step === "importing" && (
          <div className="p-8 flex flex-col items-center justify-center h-64 gap-4">
            <Spinner />
            <p className="text-sm font-medium text-gray-700">{t("importing")}</p>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="p-10 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckIcon />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t("doneTitle")}</h2>
            <p className="text-sm text-gray-500 max-w-md">
              {t("doneDesc", { count: importedCount })}
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={reset}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t("importMore")}
              </button>
              <a
                href={`/${locale}/fields`}
                className="px-5 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                {t("goToFields")}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const t = useTranslations("e9Import");
  const steps = [
    { key: "upload", label: t("step1Title") },
    { key: "review", label: t("step3Title") },
    { key: "done", label: t("doneTitle") },
  ];
  const activeIndex =
    step === "upload" || step === "processing" ? 0 :
    step === "review" || step === "importing" ? 1 : 2;

  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            i === activeIndex
              ? "bg-green-600 text-white"
              : i < activeIndex
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-400"
          }`}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold">
              {i < activeIndex ? "✓" : i + 1}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-px ${i < activeIndex ? "bg-green-300" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
  );
}

function CheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
