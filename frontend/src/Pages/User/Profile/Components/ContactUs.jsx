import { useState } from "react";
import { 
  Mail, Phone, MapPin, Send, MessageCircle, 
  Facebook, Instagram, Linkedin, Twitter, 
  Loader2, CheckCircle2, ArrowRight 
} from "lucide-react";
import banner2 from "../../../../assets/img/banner2.png";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulação de envio
    setTimeout(() => {
        console.log("Formulário enviado:", formData);
        setIsSubmitting(false);
        setSubmitted(true);
    }, 1500);
  };

  const ContactCard = ({ icon: Icon, title, desc, info, link, delay }) => (
    <a 
      href={link}
      className={`
        flex flex-col p-6 rounded-3xl border border-gray-200 bg-white 
        hover:border-[#7F33D9]/50 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1.5 
        transition-all duration-300 group cursor-pointer h-full relative overflow-hidden
        animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards
      `}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {/* Efeito de brilho no hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#7F33D9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#7F33D9] group-hover:bg-[#7F33D9] group-hover:text-white transition-all duration-300 mb-4 shadow-sm group-hover:scale-110">
        <Icon size={22} strokeWidth={2} />
      </div>
      <h3 className="font-bold text-[#111] text-sm mb-1">{title}</h3>
      <p className="text-gray-500 text-xs mb-3">{desc}</p>
      <span className="text-xs font-bold text-[#7F33D9] mt-auto break-all relative z-10 flex items-center gap-1 opacity-80 group-hover:opacity-100">
        {info} <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
      </span>
    </a>
  );

  // Estilo dos Inputs
  const inputClass = "w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#7F33D9] focus:ring-4 focus:ring-[#7F33D9]/10 transition-all duration-300 text-[#111] placeholder-gray-400 hover:bg-gray-50";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";

  return (
    <div className="max-w-7xl mx-auto pt-8 pb-20 px-4 sm:px-6">
      
      {/* Container Principal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 flex flex-col gap-6">
            
           <div className="w-full h-50 sm:h-70 lg:h-80 relative rounded-[2rem] overflow-hidden group shadow-md bg-black">
                <img 
                    src={banner2} 
                    alt="Nossa Cultura" 
                    className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 block opacity-90"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 lg:via-black/30 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 flex flex-col justify-end z-10 text-left">
                    
                    <span className="text-[#C084FC] font-bold tracking-widest text-xs uppercase mb-2 block">
                        Nossa Cultura
                    </span>
                    <h2 className="text-lg sm:text-2xl text-white drop-shadow-md">
                        Conectando apaixonados por esporte em todo o mundo.
                    </h2>
                </div>
            </div>
            {/* Barra de Redes Sociais */}
            <div className="bg-white rounded-[2rem] border border-gray-200 p-5 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-backwards" style={{ animationFillMode: 'both' }}>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-2">Siga-nos</span>
                <div className="flex gap-2">
                    {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                        <button key={i} className="w-10 h-10 rounded-full bg-gray-50 text-gray-500 hover:bg-[#7F33D9] hover:text-white transition-all duration-300 flex items-center justify-center hover:-translate-y-1">
                            <Icon size={18} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de Contatos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <ContactCard 
                    icon={MessageCircle}
                    title="Chat ao Vivo"
                    desc="Fale com nosso time agora."
                    info="Iniciar Chat"
                    link="#"
                    delay={200}
                />
                <ContactCard 
                    icon={Phone}
                    title="Telefone"
                    desc="Seg-Sex das 9h às 18h"
                    info="+55 (11) 99999-8888"
                    link="tel:+5511999998888"
                    delay={300}
                />
                <ContactCard 
                    icon={MapPin}
                    title="Visite a Sede"
                    desc="Av. Paulista, 1000 - SP"
                    info="Ver no Mapa"
                    link="#"
                    delay={400}
                />
                <ContactCard 
                    icon={Mail}
                    title="E-mail"
                    desc="Resposta em até 24h"
                    info="suporte@sportinsider.com"
                    link="mailto:suporte@sportinsider.com"
                    delay={500}
                />
            </div>
        </div>

        {/* --- COLUNA DIREITA (Formulário) --- */}
        <div className="lg:col-span-7 animate-in fade-in slide-in-from-right-8 duration-700 delay-300 fill-mode-backwards" style={{ animationFillMode: 'both' }}>
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-gray-200 shadow-2xl shadow-gray-200/50 h-full flex flex-col justify-center relative overflow-hidden">
                
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none opacity-50 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none opacity-50 animate-pulse" style={{ animationDuration: '6s' }}></div>

                {!submitted ? (
                    <div className="relative z-10">
                        <div className="mb-10">
                            <h2 className="text-4xl font-bold text-[#111] mb-3 tracking-tight">Fale Conosco</h2>
                            <p className="text-gray-500 text-lg">Preencha o formulário e entraremos em contato.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="group">
                                    <label className={labelClass}>Nome</label>
                                    <input 
                                        type="text" name="firstName" placeholder="Seu nome" 
                                        className={inputClass} required
                                        value={formData.firstName} onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Sobrenome</label>
                                    <input 
                                        type="text" name="lastName" placeholder="Sobrenome" 
                                        className={inputClass} required
                                        value={formData.lastName} onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>E-mail Corporativo</label>
                                    <input 
                                        type="email" name="email" placeholder="voce@empresa.com" 
                                        className={inputClass} required
                                        value={formData.email} onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Telefone</label>
                                    <input 
                                        type="tel" name="phone" placeholder="+55 (11) 99999-0000" 
                                        className={inputClass}
                                        value={formData.phone} onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Como podemos ajudar?</label>
                                <textarea 
                                    name="message" rows="4" placeholder="Conte-nos sobre seu projeto ou dúvida..." 
                                    className={`${inputClass} resize-none`} required
                                    value={formData.message} onChange={handleChange}
                                ></textarea>
                            </div>

                            <div className="pt-2">
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="group w-full py-4 rounded-xl bg-[#7F33D9] text-white font-bold text-sm hover:bg-[#6025A8] transition-all duration-300 shadow-xl shadow-purple-500/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            <span>Enviando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Enviar Mensagem</span>
                                            <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            <p className="text-center text-xs text-gray-400 mt-4">
                                Ao enviar, você concorda com nossa <a href="#" className="underline hover:text-[#7F33D9]">Política de Privacidade</a>.
                            </p>
                        </form>
                    </div>
                ) : (
                    // Estado de Sucesso 
                    <div className="flex flex-col items-center justify-center h-full text-center py-20 relative z-10 animate-in zoom-in-95 duration-500">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20 duration-1000"></div>
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-sm ring-4 ring-green-50 relative z-10">
                                <CheckCircle2 size={48} strokeWidth={2} className="animate-in zoom-in spin-in-90 duration-500" />
                            </div>
                        </div>
                        
                        <h3 className="text-3xl font-bold text-gray-900 mb-2 animate-in slide-in-from-bottom-2 duration-500 delay-100">Mensagem Recebida!</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-8 animate-in slide-in-from-bottom-2 duration-500 delay-200">
                            Obrigado, <strong>{formData.firstName}</strong>. Nossa equipe comercial entrará em contato em breve.
                        </p>
                        
                        <button 
                            onClick={() => setSubmitted(false)}
                            className="text-[#7F33D9] font-bold text-sm hover:text-[#6025A8] flex items-center gap-2 group animate-in slide-in-from-bottom-2 duration-500 delay-300"
                        >
                            <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                            Enviar outra mensagem
                        </button>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}