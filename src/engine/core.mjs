export function canonicalizeUrl(urlStr) {
    if (!urlStr) return '';
    try {
          const parsed = new URL(urlStr);
          parsed.hash = '';
          const paramsToKeep = new URLSearchParams();
          parsed.searchParams.forEach((value, key) => {
                  if (!['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'].includes(key.toLowerCase())) {
                            paramsToKeep.append(key, value);
                  }
          });
          parsed.search = paramsToKeep.toString() ? `?${paramsToKeep.toString()}` : '';
          let href = parsed.toString();
          if (href.endsWith('/') && parsed.pathname !== '/') {
                  href = href.slice(0, -1);
          }
          return href.toLowerCase();
    } catch (e) {
          return urlStr.trim().toLowerCase();
    }
}

export function computeFingerprint(item) {
    if (!item) return '';
    const title = (item.title || '').trim().toLowerCase();
    const company = (item.company || item.organization || '').trim().toLowerCase();
    const url = canonicalizeUrl(item.url || item.link || '');
    return `${title}|${company}|${url}`;
}

export function deduplicateOpportunities(opportunities = []) {
    const seen = new Set();
    const result = [];
    for (const item of opportunities) {
          const fp = computeFingerprint(item);
          if (fp && !seen.has(fp)) {
                  seen.add(fp);
                  result.push(item);
          } else if (!fp) {
                  result.push(item);
          }
    }
    return result;
}

export function calculateExplainableScore(opportunity, userProfile = {}) {
    let score = 50;
    const breakdown = [];
    if (!opportunity) return { score: 0, breakdown: ['No opportunity provided'] };
    const title = (opportunity.title || '').toLowerCase();
    const description = (opportunity.description || '').toLowerCase();
    const skills = userProfile.skills || ['react', 'typescript', 'node', 'python'];
    let matchedSkills = 0;
    for (const skill of skills) {
          if (title.includes(skill.toLowerCase()) || description.includes(skill.toLowerCase())) {
                  matchedSkills++;
          }
    }
    if (matchedSkills > 0) {
          const boost = Math.min(matchedSkills * 10, 30);
          score += boost;
          breakdown.push(`+${boost} points for matching skills (${matchedSkills})`);
    }
    if (opportunity.remote || title.includes('remote')) {
          score += 10;
          breakdown.push('+10 points for remote work option');
    }
    if (opportunity.pay || opportunity.salary) {
          score += 10;
          breakdown.push('+10 points for transparent compensation');
    }
    const finalScore = Math.min(Math.max(score, 0), 100);
    return { score: finalScore, breakdown };
}

export function syncDatabaseToSheetRows(records = []) {
    return records.map(rec => ({
          ID: rec.id || '',
          Title: rec.title || '',
          Company: rec.company || '',
          URL: rec.url || '',
          Type: rec.type || 'job',
          Score: rec.score || 0,
          Status: rec.status || 'new',
          CreatedAt: rec.created_at || new Date().toISOString()
    }));
}
