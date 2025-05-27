import { FiDownload, FiFileText } from 'react-icons/fi';

const WELCOME_PDF_URL = process.env.NEXT_PUBLIC_WELCOME_PDF_URL || 'https://example.com/mock-welcome.pdf';
const WELCOME_PDF_NAME = WELCOME_PDF_URL.split('/').pop();

export default function WhatsAppMessagePreview() {
  return (
    <div className="flex flex-col items-center my-8">
      <div className="flex items-end gap-2">
        {/* WhatsApp avatar with modern style */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg border-4 border-white relative">
          <svg viewBox="0 0 32 32" width={28} height={28} fill="white" className="drop-shadow-md">
            <circle cx="16" cy="16" r="16" fill="#25D366" />
            <path d="M16 7.5c-4.7 0-8.5 3.8-8.5 8.5 0 1.6.5 3.1 1.3 4.4L7 25l4.7-1.2c1.2.7 2.6 1.1 4.1 1.1 4.7 0 8.5-3.8 8.5-8.5S20.7 7.5 16 7.5zm0 15.5c-1.2 0-2.3-.3-3.3-.8l-.2-.1-2.8.7.7-2.7-.1-.2c-.7-1.1-1.1-2.3-1.1-3.6 0-3.9 3.1-7 7-7s7 3.1 7 7-3.1 7-7 7zm3.1-5.1c-.2-.1-1-.5-1.2-.6-.2-.1-.3-.1-.4.1-.1.2-.4.6-.5.7-.1.1-.2.1-.4 0-.2-.1-.7-.3-1.3-.8-.5-.4-.8-.9-.9-1.1-.1-.2 0-.2.1-.3.1-.1.2-.2.3-.4.1-.1.1-.2.2-.3.1-.1.1-.2 0-.3 0-.1-.3-.8-.4-1.1-.1-.3-.2-.3-.3-.3-.1 0-.2 0-.3 0-.1 0-.3.1-.4.2-.1.1-.6.6-.6 1.4 0 .8.6 1.6.7 1.7.1.1 1.2 1.8 2.9 2.5.4.2.7.3.9.4.4.1.7.1 1 .1.3 0 .9-.4 1-.7.1-.3.1-.7.1-.7 0-.1-.1-.1-.2-.2z" />
          </svg>
          <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#25D366" /><path d="M23.5 10.5l-8.5 8.5-3.5-3.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
        </div>
        {/* Message bubble */}
        <div className="relative max-w-xs md:max-w-md bg-green-100 text-gray-900 rounded-2xl px-5 py-4 shadow-md">
          <div className="text-base leading-relaxed whitespace-pre-line">
            Here is your complimentary mindfulness guide 🙏
          </div>
          <a
            href={WELCOME_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-2 text-green-700 hover:text-green-900 font-medium border border-green-200 rounded-lg px-3 py-2 bg-white shadow-sm transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <FiFileText className="w-5 h-5" />
            <span>{WELCOME_PDF_NAME}</span>
            <FiDownload className="w-4 h-4 ml-1" />
          </a>
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-2">WhatsApp Preview</span>
    </div>
  );
} 