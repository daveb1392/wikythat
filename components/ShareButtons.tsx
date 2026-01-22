interface ShareButtonsProps {
  topic: string;
  url: string;
}

export default function ShareButtons({ topic, url }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(
    `Check out this comparison of ${topic} on Wikipedia vs Grokipedia!`
  );

  const shareLinks = [
    {
      name: 'X (Twitter)',
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: '𝕏',
      color: 'bg-black hover:bg-gray-800',
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: 'f',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'LinkedIn',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: 'in',
      color: 'bg-blue-700 hover:bg-blue-800',
    },
  ];

  return (
    <div className="flex items-center justify-center gap-4">
      <span className="text-gray-600">Share:</span>
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded px-4 py-2 font-bold text-white transition ${link.color}`}
          aria-label={`Share on ${link.name}`}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
