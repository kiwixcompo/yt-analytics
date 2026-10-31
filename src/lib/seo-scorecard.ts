export interface SEOCheckItem {
  id: string;
  label: string;
  passed: boolean;
  score: number;
  weight: number;
  feedback: string;
}

export interface SEOResult {
  totalScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  checklist: SEOCheckItem[];
  tagMetrics: {
    count: number;
    totalCharacters: number;
    maxAllowedCharacters: number;
    commaSeparated: string;
  };
}

export function calculateVideoSEOScore(video: {
  title: string;
  description: string;
  tags?: string[];
  thumbnailUrl?: string;
}): SEOResult {
  const checklist: SEOCheckItem[] = [];

  // 1. Title Character Length (Optimal: 40-70 characters)
  const titleLen = video.title.trim().length;
  const titleLengthPass = titleLen >= 40 && titleLen <= 70;
  checklist.push({
    id: 'title_length',
    label: 'Title Length (40-70 chars)',
    passed: titleLengthPass,
    score: titleLengthPass ? 15 : titleLen > 70 ? 8 : 4,
    weight: 15,
    feedback: titleLengthPass
      ? 'Optimal title length for mobile and desktop click-throughs.'
      : titleLen > 70
      ? 'Title may be truncated on mobile devices.'
      : 'Title is too short to target key search queries.',
  });

  // 2. Description Word Count (Recommended: 150+ words)
  const words = video.description.trim().split(/\s+/).filter(Boolean).length;
  const descPass = words >= 150;
  checklist.push({
    id: 'description_length',
    label: 'Description Depth (150+ words)',
    passed: descPass,
    score: descPass ? 20 : Math.min(20, Math.floor((words / 150) * 20)),
    weight: 20,
    feedback: descPass
      ? 'Rich description providing strong algorithmic context.'
      : `Description has only ${words} words. Provide at least 150 words for search engines.`,
  });

  // 3. Tag Count (Recommended: 10-25 tags)
  const tags = video.tags || [];
  const tagCountPass = tags.length >= 8 && tags.length <= 30;
  checklist.push({
    id: 'tag_count',
    label: 'Tag Count (8 to 30 tags)',
    passed: tagCountPass,
    score: tagCountPass ? 15 : tags.length === 0 ? 0 : 7,
    weight: 15,
    feedback: tagCountPass
      ? `Good tag coverage with ${tags.length} targeted tags.`
      : tags.length === 0
      ? 'No tags detected. Add relevant keywords.'
      : 'Expand or trim your tags to between 8 and 30 tags.',
  });

  // 4. Keyword in Title Matches Description
  const titleWords = video.title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);
  
  const descLower = video.description.toLowerCase();
  const matchedWords = titleWords.filter((w) => descLower.includes(w));
  const keywordDensityPass = matchedWords.length >= Math.min(3, titleWords.length);
  checklist.push({
    id: 'keyword_cohesion',
    label: 'Title Keywords in Description',
    passed: keywordDensityPass,
    score: keywordDensityPass ? 20 : 8,
    weight: 20,
    feedback: keywordDensityPass
      ? 'Primary keywords are reinforced naturally in the description.'
      : 'Ensure key terms from your title are present in the first 2 lines of your description.',
  });

  // 5. Links or Call-to-Actions in Description
  const hasLinks = /(https?:\/\/|www\.)[^\s]+/gi.test(video.description);
  checklist.push({
    id: 'has_links',
    label: 'Links & Social CTAs in Description',
    passed: hasLinks,
    score: hasLinks ? 10 : 0,
    weight: 10,
    feedback: hasLinks
      ? 'Contains clickable links and external CTAs.'
      : 'Add social links, website links, or related playlist links to retain viewers.',
  });

  // 6. Has Timestamps / Chapters
  const hasTimestamps = /\b\d{1,2}:\d{2}\b/.test(video.description);
  checklist.push({
    id: 'timestamps',
    label: 'Video Chapters / Timestamps',
    passed: hasTimestamps,
    score: hasTimestamps ? 10 : 2,
    weight: 10,
    feedback: hasTimestamps
      ? 'Timestamps detected! Enhances viewer retention and Google search placement.'
      : 'Include 00:00 timestamps to enable YouTube Video Chapters.',
  });

  // 7. Thumbnail resolution presence
  const hasThumb = Boolean(video.thumbnailUrl);
  checklist.push({
    id: 'thumbnail',
    label: 'Custom Thumbnail Configured',
    passed: hasThumb,
    score: hasThumb ? 10 : 0,
    weight: 10,
    feedback: hasThumb ? 'Custom thumbnail is active.' : 'No thumbnail found.',
  });

  // 8. Power / Curiosity Words in Title
  const powerWords = [
    'how to', 'secret', 'guide', 'ultimate', 'best', 'top', 'fast', 'easy', 'mistake', 'why',
    'stop', 'never', 'free', 'proof', 'step by step', 'shocking', 'truth', 'hacks', 'new'
  ];
  const titleLower = video.title.toLowerCase();
  const foundPowerWords = powerWords.filter((pw) => titleLower.includes(pw));
  const hasPowerWord = foundPowerWords.length > 0;
  checklist.push({
    id: 'power_words',
    label: 'High-CTR Hook Words in Title',
    passed: hasPowerWord,
    score: hasPowerWord ? 10 : 3,
    weight: 10,
    feedback: hasPowerWord
      ? `Hook detected: "${foundPowerWords.slice(0, 2).join('", "')}". Boosts impression click-through rate.`
      : 'Consider adding a strong trigger word (e.g. "How To", "Ultimate", "Mistakes to Avoid", "Fast").',
  });

  const rawScore = checklist.reduce((sum, item) => sum + item.score, 0);
  const totalScore = Math.min(100, Math.round((rawScore / 110) * 100));

  let grade: SEOResult['grade'] = 'F';
  if (totalScore >= 90) grade = 'A+';
  else if (totalScore >= 80) grade = 'A';
  else if (totalScore >= 70) grade = 'B';
  else if (totalScore >= 55) grade = 'C';
  else if (totalScore >= 40) grade = 'D';

  const totalTagCharacters = (tags || []).reduce((acc, t) => acc + t.length, 0);
  const commaSeparatedTags = (tags || []).join(', ');

  return {
    totalScore,
    grade,
    checklist,
    tagMetrics: {
      count: tags.length,
      totalCharacters: totalTagCharacters,
      maxAllowedCharacters: 500,
      commaSeparated: commaSeparatedTags,
    },
  };
}
