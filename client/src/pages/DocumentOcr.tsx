import React, { useState } from 'react';
import { ScanText, FileText, CheckCircle2, ArrowRight, Copy } from 'lucide-react';
import { Badge } from '../components/Badge';
import { formatKg } from '../utils/formatters';
import { api } from '../api/client';

export const DocumentOcr: React.FC = () => {
  const [ocrText, setOcrText] = useState(`MAHARASHTRA STATE MOTOR VEHICLES DEPARTMENT
VEHICLE REGISTRATION: MH 40 AK 9988
CHASSIS NO: MAT628400K12904
E-WAY BILL NO: 281920194821
CONSIGNMENT / BILTY NO: LR-2026-9812
DHARAM KANTA WEIGHBRIDGE RECEIPT
GROSS WT: 35.00 MT
TARE WT: 11.00 MT
NET WT: 24.00 MT
FITNESS VALID UPTO: 15/03/2027`);

  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    try {
      setLoading(true);
      const res = await api.post<{ success: boolean; data: any }>('/ocr/extract', {
        text: ocrText
      });
      if (res.data) {
        setExtractedData(res.data);
      }
    } catch (e: any) {
      alert(`OCR Extraction error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset: 'RC' | 'EWAY' | 'WEIGHBRIDGE') => {
    if (preset === 'RC') {
      setOcrText(`GOVERNMENT OF MAHARASHTRA
REGISTRATION CERTIFICATE
REGN NO: MH 31 AP 4411
CHASSIS: MAT109288J99120
MFG DATE: 12/2021
CLASS: HGV (GOODS VEHICLE)
UNLADEN WT: 9000 KG
GVW: 28000 KG
FITNESS UPTO: 20/01/2027`);
    } else if (preset === 'EWAY') {
      setOcrText(`e-Way Bill System (Government of India)
e-Way Bill No: 991827364512
Generated Date: 28/10/2026
From: Hingna MIDC, Nagpur, Maharashtra (GSTIN: 27AABCV1234F1Z8)
To: Chakan Industrial Area, Pune (GSTIN: 27AABCT9981K1Z2)
Part-B: Vehicle Details
Vehicle No: MH 40 AK 9988
Doc No: LR-8821
Approx Distance: 720 km`);
    } else {
      setOcrText(`SHREE GANESH DHARAM KANTA
COMPUTERISED WEIGH BRIDGE SLIP
SLIP NO: 4912
TRUCK NO: MH 40 AK 9988
GROSS WT: 35.20 MT
TARE WT: 11.10 MT
NET WT: 24.10 MT
DATE: 29/10/2026 TIME: 14:32`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Transport Document OCR & Metadata Extractor
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Extraction engine for Indian transport paperwork: RC books, 12-digit e-Way bills, Bilties/LRs, and Dharam Kanta slips.
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-semibold mr-1">Load Demo Slip:</span>
        <button
          onClick={() => loadPreset('WEIGHBRIDGE')}
          className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          Dharam Kanta Weighbridge
        </button>
        <button
          onClick={() => loadPreset('EWAY')}
          className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          e-Way Bill (Part-B)
        </button>
        <button
          onClick={() => loadPreset('RC')}
          className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          VAHAN RC Book
        </button>
      </div>

      {/* Editor & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw OCR Text Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Raw Document OCR Text Input
            </h2>
            <Badge variant="slate" size="sm">Tesseract.js Engine</Badge>
          </div>

          <textarea
            rows={14}
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-indigo-500 leading-relaxed text-slate-800"
            placeholder="Paste raw OCR text here..."
          />

          <button
            onClick={handleExtract}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition"
          >
            {loading ? 'Analyzing Document Patterns...' : 'Run Regex Extraction'}
          </button>
        </div>

        {/* Structured Results */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Extracted Structured Fields
          </h2>

          {extractedData ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Vehicle Registration (RC)</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {extractedData.vehicleRegistrationNumber || 'Not Found'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">12-Digit e-Way Bill #</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {extractedData.ewayBillNumber || 'Not Found'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Bilty / Lorry Receipt (LR) #</span>
                <span className="font-mono font-bold text-indigo-700 text-sm">
                  {extractedData.biltyNumber || 'Not Found'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <div>
                  <span className="text-slate-400 text-[10px]">Gross Weight</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {extractedData.grossWeightKg ? formatKg(extractedData.grossWeightKg) : '-'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Tare Weight</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {extractedData.tareWeightKg ? formatKg(extractedData.tareWeightKg) : '-'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Net Payload</span>
                  <div className="font-bold text-emerald-700 mt-0.5">
                    {extractedData.netWeightKg ? formatKg(extractedData.netWeightKg) : '-'}
                  </div>
                </div>
              </div>

              {extractedData.extractedDates?.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium block mb-1">Detected Dates:</span>
                  <div className="flex flex-wrap gap-2">
                    {extractedData.extractedDates.map((d: string, idx: number) => (
                      <span key={idx} className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                        {new Date(d).toLocaleDateString('en-IN')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <ScanText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">Click "Run Regex Extraction" to parse fields.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
