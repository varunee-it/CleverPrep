import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import FlashcardManager from "../../components/flashcards/FlashcardManager";

const FlashcardPage = () => {
  const { id: documentId } = useParams();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          to={`/documents/${documentId}`}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors duration-200"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Document
        </Link>
      </div>
      <FlashcardManager documentId={documentId} />
    </div>
  );
};

export default FlashcardPage;