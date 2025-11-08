import { useState } from 'react';
import UserLayout from '../../components/UserLayout';

const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'token';

export default function ATSScore() {
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [jobsList, setJobsList] = useState([]);

  const extractPdfText = async (file) => {
    const pdfjsLib = await import('pdfjs-dist/build/pdf');
    const version = pdfjsLib.version || '4.0.379';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let text = '';
    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 20); pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map((it) =>
        typeof it.str === 'string' ? it.str : ''
      );
      text += strings.join(' ') + '\n';
    }
    return text;
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setResult(null);
    setFileName(file.name);

    if (!/pdf$/i.test(file.name)) {
      setError('Please upload a PDF resume');
      return;
    }

    setLoading(true);
    try {
      const resumeText = await extractPdfText(file);
      const jobsRes = await fetch(`${API}/jobs`);
      const jobs = await jobsRes.json();
      if (!jobsRes.ok) throw new Error('Failed to load jobs');
      setJobsList(jobs);

      const token = localStorage.getItem(TOKEN_KEY);
      const atsRes = await fetch(`${API}/ai/ats-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeText, jobs }),
      });
      const data = await atsRes.json();
      if (!atsRes.ok) throw new Error(data?.error || 'Failed to score');
      setResult(data);
    } catch (err) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <UserLayout>
      <div className="max-w-5xl mx-auto p-6 sm:p-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">
            ATS Score Analyzer
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Upload your PDF resume to get an ATS compatibility score and view top job matches.
          </p>
        </div>

        {/* Upload Box */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 mb-8 text-center hover:shadow-md transition-all duration-200">
          <label className="inline-flex flex-col items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-indigo-200 font-medium text-indigo-700 cursor-pointer hover:from-indigo-100 hover:to-blue-100 transition-colors duration-200">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFile}
            />
            <svg
              className="w-8 h-8 text-indigo-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903 5 5 0 119.786 2.16A4.5 4.5 0 1117.5 16H16m-4-4v9m0 0l-3-3m3 3l3-3"
              />
            </svg>
            <span className="text-lg">
              {loading ? 'Analyzing Resume...' : 'Upload Your Resume'}
            </span>
          </label>

          {fileName && (
            <p className="text-sm text-slate-500 mt-3">
              Selected File: <span className="font-semibold">{fileName}</span>
            </p>
          )}
          {error && <p className="text-sm text-rose-600 mt-3">{error}</p>}
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-8">
            {/* Overall Score */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-all duration-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Overall Score</h2>
              <div className="flex items-center justify-center gap-2">
                <p className="text-5xl font-extrabold text-indigo-600">
                  {Math.round(result.overallScore)}
                </p>
                <span className="text-lg text-slate-500">/ 100</span>
              </div>
            </div>

            {/* Job Match Scores */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-all duration-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Job Match Scores
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left text-slate-600 border-b border-slate-200">
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result.jobScores || []).map((j) => (
                      <tr
                        key={j.jobId}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150"
                      >
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {(
                            jobsList.find(
                              (job) =>
                                (job._id || job.id) === j.jobId
                            )?.company || j.jobId
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-indigo-600">
                          {Math.round(j.score)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-pre-wrap">
                          {j.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Suggestions */}
            {Array.isArray(result.topJobs) && result.topJobs.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-all duration-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-3">
                  Top Job Suggestions
                </h2>
                <ul className="space-y-2">
                  {result.topJobs.slice(0, 5).map((id) => (
                    <li key={id}>
                      <a
                        href={`/user/jobs/${id}`}
                        className="text-indigo-600 font-medium hover:underline"
                      >
                        View & Apply for Job {id}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
