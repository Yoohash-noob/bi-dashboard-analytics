import React from 'react';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="landing-container" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background decorations */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(15,23,42,0) 70%)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, rgba(15,23,42,0) 70%)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }}></div>

      <div style={{ zIndex: 1, textAlign: 'center', padding: '2rem', maxWidth: '800px' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#38bdf8' }}>
            Enterprise Business Intelligence
          </div>
        </div>
        
        <h1 style={{ fontSize: '4rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Data is Your Greatest Asset. <br/>
          <span style={{ color: '#8b5cf6', WebkitTextFillColor: '#8b5cf6' }}>Unlock its Potential.</span>
        </h1>
        
        <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '3rem', lineHeight: '1.6' }}>
          Transform raw sales data into actionable insights instantly. Experience real-time data warehousing, OLAP cube simulation, and AI-driven customer segmentation (K-Means) in one seamless dashboard.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={onGetStarted}
            style={{
              padding: '1rem 2.5rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.5)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(139, 92, 246, 0.6)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(139, 92, 246, 0.5)'; }}
          >
            Mulai Analisis Sekarang
          </button>
        </div>
      </div>

      <div style={{ zIndex: 1, display: 'flex', gap: '2rem', marginTop: '5rem', padding: '0 2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { icon: '📊', title: 'Live Dashboard', desc: 'Real-time charts and KPIs from your data.' },
          { icon: '🤖', title: 'Smart K-Means', desc: 'AI-driven customer segmentation out of the box.' },
          { icon: '📝', title: 'Data Management', desc: 'In-memory CRUD operations directly in browser.' },
        ].map((feat, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '1.5rem',
            borderRadius: '16px',
            width: '250px',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feat.icon}</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#e2e8f0' }}>{feat.title}</h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{feat.desc}</p>
          </div>
        ))}
      </div>
      
    </div>
  );
};

export default LandingPage;
