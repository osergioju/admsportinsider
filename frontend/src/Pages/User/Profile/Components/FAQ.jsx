import { useState, useEffect } from "react";
import { api } from "../../../../services/api";
import { useTranslation } from "../../../../context/TranslationContext";
import { 
  HelpCircle, 
  Plus, 
  Minus, 
  MessageCircle, 
  Search 
} from "lucide-react";

export default function Faq() {
  const { t } = useTranslation();
  const [openIndices, setOpenIndices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [faqData, setFaqData] = useState([]);

  const toggleFAQ = (index) => { 
    setOpenIndices((prev) => 
      prev.includes(index) 
        ? prev.filter((i) => i !== index)
        : [...prev, index]     
    );
  };

  useEffect(() => {
    api.get("/user/faq").then(res => setFaqData(res.data));
  }, []);

  const filteredFaqs = faqData.filter(item => 
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const btnPurpleClass = "group flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white bg-[#7F33D9] hover:bg-[#6025A8] shadow-md shadow-purple-500/20 transition-all duration-300";

  return (
    <div className="max-w-4xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111]">{t("faq.title", "Perguntas Frequentes")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("faq.subtitle", "Tire suas dúvidas sobre a plataforma e funcionalidades.")}</p>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={t("faq.search_placeholder", "Buscar uma dúvida...")}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all shadow-sm text-[#111] placeholder-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#7F33D9]/10 flex items-center justify-center">
              <HelpCircle size={20} className="text-[#7F33D9]" />
          </div>
          <h2 className="text-lg font-semibold text-[#111]">{t("faq.general_doubts", "Dúvidas Gerais")}</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((item, index) => {
              const isOpen = openIndices.includes(index);

              return (
                <div key={index} className="group">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors focus:outline-none group"
                  >
                    <span className={`text-sm font-medium transition-colors ${isOpen ? "text-[#7F33D9]" : "text-[#111]"}`}>
                      {item.question}
                    </span>
                    
                    <span className="text-[#7F33D9] transition-transform duration-300 ease-out group-hover:scale-125">
                      {isOpen ? (
                        <Minus size={24} strokeWidth={2.5} />
                      ) : (
                        <Plus size={24} strokeWidth={2.5} />
                      )}
                    </span>
                  </button>
                  
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">
              {t("faq.not_found", "Nenhuma dúvida encontrada para")} "{searchTerm}".
            </div>
          )}
        </div>
      </div>

      <div className="w-full bg-[#F9F5FF] rounded-2xl border border-[#7F33D9]/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white border border-[#7F33D9]/20 flex items-center justify-center text-[#7F33D9]">
            <MessageCircle size={20} />
          </div>
          <div>
            <h3 className="text-[#111] font-semibold text-sm">{t("faq.need_help", "Ainda precisa de ajuda?")}</h3>
            <p className="text-gray-500 text-xs">{t("faq.support_text", "Nossa equipe de suporte responde em até 24h.")}</p>
          </div>
        </div>
        <button className={btnPurpleClass}>
          {t("faq.contact_support", "Falar com suporte")}
        </button>
      </div>

    </div>
  );
}