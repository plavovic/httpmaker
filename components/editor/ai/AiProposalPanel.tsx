import type { AiPatchProposal } from "@/types/ai";

type Props = { proposal: AiPatchProposal; onApply: () => void; onDiscard: () => void };

export default function AiProposalPanel({ proposal, onApply, onDiscard }: Props) {
  return <section className="ai-proposal" aria-label="AI change proposal">
    <div className="ai-proposal-header"><div><span>Review changes</span><h3>AI proposal</h3></div><span className="ai-proposal-count">{proposal.summary.length}</span></div>
    <div className="ai-proposal-summary">{proposal.summary.map((item, index) => <div className="ai-proposal-item" key={`${item.scope}-${item.sectionId ?? "website"}-${index}`}><strong>{item.title}</strong><ul>{item.changes.map((change) => <li key={change}>{change}</li>)}</ul></div>)}</div>
    {proposal.warnings.length > 0 && <div className="ai-proposal-warnings"><strong>Warnings</strong>{proposal.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}
    <div className="ai-proposal-actions"><button type="button" className="ai-proposal-discard" onClick={onDiscard}>Discard</button><button type="button" className="ai-proposal-apply" onClick={onApply} disabled={proposal.summary.length === 0}>Apply changes</button></div>
  </section>;
}
