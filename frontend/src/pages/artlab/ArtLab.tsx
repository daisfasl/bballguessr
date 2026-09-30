// dev-only design lab at /__art — type specimen + art component demos. delete before shipping.

import { PrintLab } from './PrintLab'

const SAMPLE_ROWS = [
    ['2003-04', '19', 'CLE', '79', '20.9', '5.5', '5.9', ''],
    ['2004-05', '20', 'CLE', '80', '27.2', '7.4', '7.2', 'AS,NBA2'],
    ['2005-06', '21', 'CLE', '79', '31.4', '7.0', '6.6', 'AS,NBA1'],
]

function Specimen() {
    return (
        <section className="ArtLab-section">
            <p className="label">Type</p>
            <h1 className="display" style={{ fontSize: 'clamp(3.5rem, 12vw, 8rem)' }}>bballguessr</h1>
            <h2 className="display" style={{ fontSize: '4.5rem', marginTop: '2rem' }}>LeBron James</h2>
            <p style={{ maxWidth: '42ch', color: 'var(--muted)' }}>
                Five NBA players. Only their basketball-reference stat lines to go on. Three guesses each round.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1.5rem 0' }}>
                <span className="pill">5 rounds</span>
                <span className="pill">MVP-1</span>
                <span className="pill pill-solid">+2</span>
                <span className="pill pill-struck">Kobe Bryant</span>
                <span className="callout-num">01</span>
                <span className="callout-num">05</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn">Quick play</button>
                <button type="button" className="btn btn-ghost">Create challenge</button>
                <button type="button" className="btn" disabled>Starting…</button>
            </div>
            <table style={{ marginTop: '2rem', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--ink)' }}>
                        {['Season', 'Age', 'Team', 'G', 'PTS', 'TRB', 'AST', 'Awards'].map((h) => (
                            <th key={h} className="label" style={{ textAlign: 'left', padding: '0.6rem 0.9rem 0.6rem 0' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {SAMPLE_ROWS.map((r) => (
                        <tr key={r[0]} style={{ borderBottom: '1px solid var(--rule)' }}>
                            {r.slice(0, 7).map((c, i) => (
                                <td key={i} style={{ padding: '0.55rem 0.9rem 0.55rem 0' }}>{c}</td>
                            ))}
                            <td style={{ display: 'flex', gap: '0.3rem', padding: '0.45rem 0' }}>
                                {r[7] && r[7].split(',').map((a) => <span key={a} className="pill">{a}</span>)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                {['--paper', '--paper-2', '--ink', '--ink-2', '--muted', '--rule'].map((v) => (
                    <div key={v} style={{ textAlign: 'center' }}>
                        <div style={{ width: 56, height: 56, background: `var(${v})`, border: '1px solid var(--rule)' }} />
                        <span className="label">{v.slice(2)}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default function ArtLab() {
    return (
        <div className="page">
            <Specimen />
            <PrintLab />
        </div>
    )
}
