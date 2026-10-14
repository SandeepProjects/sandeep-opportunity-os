import React, { useState, useEffect } from 'react';

interface Opportunity {
    id: string;
    title: string;
    company: string;
    type: string;
    score: number;
    location?: string;
    description?: string;
    tags?: string[];
    url?: string;
}

const mockOpportunities: Record<string, Opportunity[]> = {
    '/today': [
      { id: '1', title: 'Senior Full Stack Engineer', company: 'Tech Corp', type: 'jobs', score: 92, location: 'Remote', description: 'Lead development of core features using React and Node.js.', tags: ['React', 'TypeScript', 'Node.js'] },
      { id: '2', title: 'Freelance Frontend Developer', company: 'Design Studio', type: 'freelance', score: 88, location: 'Contract', description: 'Build responsive web apps.', tags: ['React', 'CSS'] }
        ],
    '/freelance': [
      { id: '3', title: 'UI/UX Redesign Project', company: 'StartupX', type: 'freelance', score: 85, location: 'Remote', description: 'Redesign SaaS dashboard.', tags: ['Figma', 'React'] }
        ],
    '/jobs': [
      { id: '4', title: 'Backend Software Engineer', company: 'Data Inc', type: 'jobs', score: 90, location: 'San Francisco, CA', description: 'Scale distributed backend systems.', tags: ['Python', 'PostgreSQL'] }
        ],
    '/masters': [
      { id: '5', title: 'M.Sc. Computer Science', company: 'Tech University', type: 'masters', score: 95, location: 'Online', description: 'Advanced research in AI & ML.', tags: ['AI', 'Data Science'] }
        ],
    '/remote': [
      { id: '6', title: 'Remote DevOps Specialist', company: 'CloudWorks', type: 'remote', score: 89, location: 'Worldwide', description: 'Manage Kubernetes & CI/CD pipelines.', tags: ['Docker', 'AWS'] }
        ],
    '/saved': [
      { id: '1', title: 'Senior Full Stack Engineer', company: 'Tech Corp', type: 'jobs', score: 92, location: 'Remote', description: 'Lead development of core features.', tags: ['React', 'TypeScript'] }
        ],
    '/operations': [
      { id: '7', title: 'Sync Engine Health Check', company: 'System', type: 'operations', score: 100, location: 'Internal', description: 'All database sync jobs are operational.', tags: ['Database', 'Sync'] }
        ],
    '/profile': []
};

export default function App() {
    const [currentRoute, setCurrentRoute] = useState<string>(window.location.pathname || '/today');
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const navigateTo = (path: string) => {
        setCurrentRoute(path);
        window.history.pushState({}, '', path);
  };

  const opportunities = mockOpportunities[currentRoute] || [];

  return (
        <div className="app-container" style={{ display: 'flex', minHeight: '100vh' }}>
                <aside className="sidebar" style={{ width: '240px', padding: '1rem', borderRight: '1px solid var(--border, #333)' }}>
                          <h2>Sandeep OS</h2>h2>
                        <nav>
                                  <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {[
          { path: '/today', label: 'Today' },
          { path: '/freelance', label: 'Freelance' },
          { path: '/jobs', label: 'Jobs' },
          { path: '/masters', label: 'Masters' },
          { path: '/remote', label: 'Remote' },
          { path: '/saved', label: 'Saved' },
          { path: '/operations', label: 'Operations' },
          { path: '/profile', label: 'Profile' }
                      ].map(item => (
                                      <li key={item.path} style={{ margin: '0.5rem 0' }}>
                                                      <a
                                                                          href={item.path}
                                                                          onClick={(e) => { e.preventDefault(); navigateTo(item.path); }}
                                                                          style={{
                                                                                                fontWeight: currentRoute === item.path ? 'bold' : 'normal',
                                                                                                color: currentRoute === item.path ? 'var(--accent, #0070f3)' : 'inherit',
                                                                                                textDecoration: 'none'
                                                                            }}
                                                                        >
                                                        {item.label}
                                                      </a>a>
                                      </li>li>
                                    ))}
                                  </ul>ul>
                        </nav>nav>
                        <button onClick={toggleTheme} style={{ marginTop: '2rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                                  Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
                        </button>button>
                </aside>aside>
        
              <main className="content" style={{ flex: 1, padding: '2rem' }}>
                      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h1>{currentRoute.replace('/', '').toUpperCase() || 'TODAY'}</h1>h1>
                                <span>Current Theme: {theme}</span>span>
                      </header>header>
              
                {currentRoute === '/profile' ? (
                    <section className="profile-section">
                                <h2>User Profile</h2>h2>
                                <p><strong>Name:</strong>strong> Sandeep</p>p>
                                <p><strong>Target Roles:</strong>strong> Full Stack Engineer, AI Researcher, Freelancer</p>p>
                                <p><strong>Preferences:</strong>strong> Remote / Hybrid, High Impact</p>p>
                    </section>section>
                  ) : (
                    <section className="opportunities-list">
                                <h3>Opportunities ({opportunities.length})</h3>h3>
                      {opportunities.length === 0 ? (
                                    <p>No opportunities found for this view.</p>p>
                                  ) : (
                                    <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                      {opportunities.map(op => (
                                                        <div
                                                                              key={op.id}
                                                                              onClick={() => setSelectedOpportunity(op)}
                                                                              style={{
                                                                                                      border: '1px solid var(--border, #ccc)',
                                                                                                      padding: '1rem',
                                                                                                      borderRadius: '8px',
                                                                                                      cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                            <h4>{op.title}</h4>h4>
                                                                            <p>{op.company} &bull; {op.location}</p>p>
                                                                            <p>Score: <strong>{op.score}/100</strong>strong></p>p>
                                                        </div>div>
                                                      ))}
                                    </div>div>
                                )}
                    </section>section>
                      )}
              </main>main>
        
          {selectedOpportunity && (
                  <div
                              className="drawer-backdrop"
                              style={{
                                            position: 'fixed',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundColor: 'rgba(0,0,0,0.5)',
                                            display: 'flex', justifyContent: 'flex-end'
                              }}
                              onClick={() => setSelectedOpportunity(null)}
                            >
                            <div
                                          className="drawer"
                                          style={{
                                                          width: '400px',
                                                          height: '100%',
                                                          backgroundColor: 'var(--surface, #fff)',
                                                          color: 'var(--text-primary, #000)',
                                                          padding: '2rem',
                                                          boxShadow: '-2px 0 8px rgba(0,0,0,0.2)',
                                                          overflowY: 'auto'
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                        <button
                                                        onClick={() => setSelectedOpportunity(null)}
                                                        style={{ float: 'right', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                                                      >
                                                      Close
                                        </button>button>
                                        <h2>{selectedOpportunity.title}</h2>h2>
                                        <p><strong>Company:</strong>strong> {selectedOpportunity.company}</p>p>
                                        <p><strong>Location:</strong>strong> {selectedOpportunity.location}</p>p>
                                        <p><strong>Score:</strong>strong> {selectedOpportunity.score}/100</p>p>
                                        <p><strong>Description:</strong>strong></p>p>
                                        <p>{selectedOpportunity.description}</p>p>
                              {selectedOpportunity.tags && (
                                                        <div>
                                                                        <strong>Tags:</strong>strong>
                                                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                                          {selectedOpportunity.tags.map(tag => (
                                                                              <span key={tag} style={{ background: 'var(--accent, #0070f3)', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                                                {tag}
                                                                              </span>span>
                                                                            ))}
                                                                        </div>div>
                                                        </div>div>
                                        )}
                            </div>div>
                  </div>div>
              )}
        </div>div>
      );
}
</h2>
