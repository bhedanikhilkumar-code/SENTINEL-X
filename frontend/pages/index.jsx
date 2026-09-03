import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DashboardView from "../components/views/DashboardView";
import WorkbenchView from "../components/views/WorkbenchView";
import StylometryView from "../components/views/StylometryView";
import IngestView from "../components/views/IngestView";
import AuditView from "../components/views/AuditView";
import DossierView from "../components/views/DossierView";
import PresentationView from "../components/views/PresentationView";
import DemoGuideModal from "../components/DemoGuideModal";
import VideoShowcaseModal from "../components/views/VideoShowcaseModal";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeRole, setActiveRole] = useState("analyst_demo");
  const [health, setHealth] = useState(null);
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [auditLog, setAuditLog] = useState([]);

  // Pitch HUD & Video Showcase Modal States
  const [showPitchHud, setShowPitchHud] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Fetch all initial data
  const loadData = async () => {
    try {
      // 1. Health check
      const h = await fetch("/api/health").then((r) => r.json()).catch(() => null);
      setHealth(h);

      // 2. Cases list
      const cs = await fetch("/api/cases").then((r) => r.json()).catch(() => []);
      setCases(cs);

      // Set active case
      if (cs?.length > 0) {
        const cId = selectedCaseId || cs[0].id;
        setSelectedCaseId(cId);
        const cd = await fetch(`/api/cases/${cId}`).then((r) => r.json()).catch(() => null);
        setCaseData(cd);
      }

      // 3. Knowledge Graph
      const g = await fetch("/api/graph").then((r) => r.json()).catch(() => ({ nodes: [], edges: [] }));
      setGraphData(g);

      // 4. Audit Log
      const a = await fetch("/api/audit").then((r) => r.json()).catch(() => []);
      setAuditLog(a);
    } catch (err) {
      console.error("Data load error:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selected case
  const handleSelectCase = async (cId) => {
    setSelectedCaseId(cId);
    try {
      const cd = await fetch(`/api/cases/${cId}`).then((r) => r.json());
      setCaseData(cd);
    } catch (err) {
      console.error(err);
    }
  };

  // Case Status update
  const handleUpdateStatus = async (cId, newStatus) => {
    try {
      await fetch(`/api/cases/${cId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, actor: activeRole }),
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Add hypothesis
  const handleAddHypothesis = async (claim) => {
    if (!selectedCaseId) return;
    try {
      await fetch(`/api/cases/${selectedCaseId}/hypotheses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: claim,
          created_by: activeRole,
          signals: [
            { signal_type: "handle_match", ci: 0.4, detail: { handle: "DarkViper" } },
            { signal_type: "pgp_fingerprint_exact", ci: 0.95, detail: { key: "9F3A21C0D4E7B881" } }
          ],
        }),
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 flex flex-col select-none relative">
      {/* Top Intelligence Navbar */}
      <Navbar
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        health={health}
        onRefresh={loadData}
        onTogglePitchHud={() => setShowPitchHud(!showPitchHud)}
        onToggleVideoModal={() => setShowVideoModal(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          caseData={caseData}
        />

        {/* Dynamic Center View Container */}
        <main className="flex-1 overflow-hidden bg-[#080c15]">
          {activeTab === "dashboard" && (
            <DashboardView
              cases={cases}
              onSelectCase={handleSelectCase}
              onUpdateStatus={handleUpdateStatus}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "workbench" && (
            <WorkbenchView
              caseData={caseData}
              graphData={graphData}
              onAddHypothesis={handleAddHypothesis}
            />
          )}

          {activeTab === "stylometry" && (
            <StylometryView caseData={caseData} />
          )}

          {activeTab === "ingest" && (
            <IngestView
              caseData={caseData}
              onIngestSuccess={loadData}
            />
          )}

          {activeTab === "audit" && (
            <AuditView
              auditLog={auditLog}
              onRefreshAudit={loadData}
            />
          )}

          {activeTab === "dossier" && (
            <DossierView caseData={caseData} />
          )}

          {activeTab === "presentation" && (
            <PresentationView />
          )}
        </main>
      </div>

      {/* Floating 5-Minute Live Pitch HUD Prompter */}
      <DemoGuideModal
        isOpen={showPitchHud}
        onClose={() => setShowPitchHud(false)}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      {/* Interactive Video Showcase & Architecture Modal */}
      <VideoShowcaseModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />
    </div>
  );
}
