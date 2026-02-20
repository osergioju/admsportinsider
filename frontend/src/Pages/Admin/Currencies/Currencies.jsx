import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Coins, Globe, TrendingUp, Calendar } from 'lucide-react';
import { api } from "../../../services/api";
const btnPrimary = "px-4 py-2 bg-[#7F33D9] text-white rounded-lg hover:bg-[#6B2BB8] transition-all flex items-center gap-2 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
const btnSecondary = "px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:border-[#7F33D9] hover:text-[#7F33D9] transition-all flex items-center gap-2 font-medium shadow-sm";
const btnDanger = "p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all";
const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F33D9] focus:border-transparent transition-all";

function FeedbackMessage({ msg }) {
  if (!msg) return null;
  const isError = msg.includes('Erro') || msg.includes('erro');
  return (
    <div className={`mb-6 p-4 rounded-xl border-l-4 ${isError ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'} animate-in slide-in-from-top-2 duration-300`}>
      <p className="font-medium">{msg}</p>
    </div>
  );
}

export default function Currencies() {
    const [currencies, setCurrencies] = useState([]);
    const [countries, setCountries] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        id_country: '',
        code: '',
        name: '',
        symbol: ''
    });

    useEffect(() => {
        loadCurrencies();
    }, []);

    const loadCurrencies = async () => {
        try {
            setLoading(true);
            const response = await api.get('/currency/currencies');
            setCurrencies(response.data);
        } catch (error) {
            showFeedback('Erro ao carregar moedas', true);
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableCountries = async () => {
        try {
            const response = await api.get('/admin/countries');
            setCountries(response.data.countries);
        } catch (error) {
            showFeedback('Erro ao carregar países disponíveis', true);
        }
    };

    const handleNewCurrency = () => {
        loadAvailableCountries();
        setFormData({ id_country: '', code: '', name: '', symbol: '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/currency/currencies', formData);
            showFeedback('Moeda cadastrada com sucesso!');
            setShowModal(false);
            loadCurrencies();
            setFormData({ id_country: '', code: '', name: '', symbol: '' });
        } catch (error) {
            showFeedback(error.response?.data?.error || 'Erro ao cadastrar moeda', true);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta moeda?')) return;
        try {
            await api.delete(`/currencies/${id}`);
            showFeedback('Moeda excluída com sucesso!');
            loadCurrencies();
        } catch (error) {
            showFeedback('Erro ao excluir moeda', true);
        }
    };

    const showFeedback = (message, isError = false) => {
        setFeedback(message);
        setTimeout(() => setFeedback(''), 4000);
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#111] flex items-center gap-2">
                        <Coins className="text-[#7F33D9]" size={28} />
                        Gestão de Moedas
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Cadastre moedas, vincule países e configure taxas de câmbio
                    </p>
                </div>
                <button onClick={handleNewCurrency} className={btnPrimary}>
                    <Plus size={18} />
                    Nova Moeda
                </button>
            </div>

            <FeedbackMessage msg={feedback} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-gray-400">
                        Carregando moedas...
                    </div>
                ) : currencies.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl border border-gray-200 p-10 text-center">
                        <Coins size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">Nenhuma moeda cadastrada ainda</p>
                        <button onClick={handleNewCurrency} className={btnSecondary}>
                            <Plus size={18} />
                            Cadastrar primeira moeda
                        </button>
                    </div>
                ) : (
                    currencies.map((currency) => (
                        <CurrencyCard 
                            key={currency.id} 
                            currency={currency} 
                            onDelete={handleDelete}
                            onManage={setSelectedCurrency}
                        />
                    ))
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Plus size={24} className="text-[#7F33D9]" />
                            Nova Moeda
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">País</label>
                                <select value={formData.id_country} onChange={(e) => setFormData({...formData, id_country: e.target.value})} className={inputClass} required>
                                    <option value="">Selecione um país</option>
                                    {countries.map(c => (
                                        <option key={c.id_country} value={c.id_country}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Código da Moeda</label>
                                <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className={inputClass} placeholder="BRL" maxLength={3} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Moeda</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={inputClass} placeholder="Real Brasileiro" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Símbolo</label>
                                <input type="text" value={formData.symbol} onChange={(e) => setFormData({...formData, symbol: e.target.value})} className={inputClass} placeholder="R$" required />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="submit" className={btnPrimary + " flex-1"}>Cadastrar</button>
                                <button type="button" onClick={() => setShowModal(false)} className={btnSecondary}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedCurrency && (
                <CurrencyManagementModal currency={selectedCurrency} onClose={() => setSelectedCurrency(null)} />
            )}
        </div>
    );
}

function CurrencyCard({ currency, onDelete, onManage }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7F33D9] to-[#9D5CE8] flex items-center justify-center text-white font-bold text-lg">
                        {currency.symbol}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{currency.code}</h3>
                        <p className="text-xs text-gray-500">{currency.name}</p>
                    </div>
                </div>
                <button onClick={() => onDelete(currency.id)} className={btnDanger}>
                    <Trash2 size={16} />
                </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Globe size={14} />
                <span>{currency.country_name || 'País não vinculado'}</span>
            </div>
            <button onClick={() => onManage(currency)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-[#7F33D9] hover:text-white hover:border-[#7F33D9] transition-all flex items-center justify-center gap-2 text-sm font-medium group-hover:bg-[#7F33D9] group-hover:text-white group-hover:border-[#7F33D9]">
                <TrendingUp size={16} />
                Gerenciar Câmbio
            </button>
        </div>
    );
}

function CurrencyManagementModal({ currency, onClose }) {
    const [pairs, setPairs] = useState([]);
    const [availableCurrencies, setAvailableCurrencies] = useState([]);
    const [selectedPair, setSelectedPair] = useState(null);
    const [showPairModal, setShowPairModal] = useState(false);
    const [showRateModal, setShowRateModal] = useState(false);
    const [newPairCurrency, setNewPairCurrency] = useState('');
    const [rates, setRates] = useState([]);
    const [newRate, setNewRate] = useState({ year: new Date().getFullYear(), rate: '' });
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        loadPairs();
        loadAvailableCurrencies();
    }, []);

    const loadPairs = async () => {
        try {
            const response = await api.get(`/currency/currencies/${currency.id}/pairs`);
            setPairs(response.data);
        } catch (error) {
            console.error('Erro ao carregar pares:', error);
        }
    };

    const loadAvailableCurrencies = async () => {
        try {
            const response = await api.get(`/currency/currencies/${currency.id}/other-currencies`);
            setAvailableCurrencies(response.data);
            console.log(response.data);
        } catch (error) {
            console.error('Erro ao carregar moedas:', error);
        }
    };

    const handleCreatePair = async () => {
        if (!newPairCurrency) return;
        try {
            await api.post('/currency/currency-pairs', {
                from_currency_id: currency.id,
                to_currency_id: newPairCurrency
            });
            showFeedback('Par criado com sucesso!');
            setShowPairModal(false);
            setNewPairCurrency('');
            loadPairs();
        } catch (error) {
            showFeedback(error.response?.data?.error || 'Erro ao criar par', true);
        }
    };

    const handleDeletePair = async (pairId) => {
        if (!window.confirm('Remover este par de câmbio?')) return;
        try {
            await api.delete(`/currency/currency-pairs/${pairId}`);
            showFeedback('Par removido com sucesso!');
            loadPairs();
            if (selectedPair?.id === pairId) setSelectedPair(null);
        } catch (error) {
            showFeedback('Erro ao remover par', true);
        }
    };

    const handleManageRates = async (pair) => {
        setSelectedPair(pair);
        try {
            const response = await api.get(`/currency-pairs/${pair.id}/rates`);
            setRates(response.data);
        } catch (error) {
            console.error('Erro ao carregar taxas:', error);
        }
    };

    const handleCreateRate = async () => {
        if (!newRate.year || !newRate.rate) return;
        try {
            await api.post('/currency-rates', {
                pair_id: selectedPair.id,
                year: newRate.year,
                rate: newRate.rate
            });
            showFeedback('Taxa cadastrada com sucesso!');
            setShowRateModal(false);
            setNewRate({ year: new Date().getFullYear(), rate: '' });
            handleManageRates(selectedPair);
        } catch (error) {
            showFeedback(error.response?.data?.error || 'Erro ao cadastrar taxa', true);
        }
    };

    const handleDeleteRate = async (rateId) => {
        if (!window.confirm('Remover esta taxa?')) return;
        try {
            await api.delete(`/currency-rates/${rateId}`);
            showFeedback('Taxa removida com sucesso!');
            handleManageRates(selectedPair);
        } catch (error) {
            showFeedback('Erro ao remover taxa', true);
        }
    };

    const showFeedback = (message, isError = false) => {
        setFeedback(message);
        setTimeout(() => setFeedback(''), 3000);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full my-8 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <TrendingUp className="text-[#7F33D9]" size={24} />
                                Gerenciar Câmbio - {currency.code}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">{currency.name}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
                    </div>
                </div>

                <FeedbackMessage msg={feedback} />

                <div className="p-6">
                    {!selectedPair ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-700">Pares de Câmbio</h3>
                                <button onClick={() => setShowPairModal(true)} className={btnSecondary}>
                                    <Plus size={16} />
                                    Novo Par
                                </button>
                            </div>

                            {pairs.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 border border-dashed border-gray-300 rounded-xl">
                                    <p>Nenhum par cadastrado ainda</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {pairs.map(pair => (
                                        <div key={pair.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#7F33D9] transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">{pair.from_symbol} → {pair.to_symbol}</div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{pair.from_code} / {pair.to_code}</p>
                                                    <p className="text-xs text-gray-500">{pair.to_country_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleManageRates(pair)} className={btnSecondary}>
                                                    <Calendar size={16} />
                                                    Taxas
                                                </button>
                                                <button onClick={() => handleDeletePair(pair.id)} className={btnDanger}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <button onClick={() => setSelectedPair(null)} className="mb-4 text-[#7F33D9] hover:underline text-sm">
                                ← Voltar aos pares
                            </button>

                            <div className="mb-4 p-4 bg-gradient-to-r from-[#7F33D9] to-[#9D5CE8] text-white rounded-xl">
                                <p className="text-sm opacity-90">Par de Câmbio</p>
                                <p className="text-2xl font-bold">{selectedPair.from_code} → {selectedPair.to_code}</p>
                            </div>

                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-700">Taxas por Ano</h3>
                                <button onClick={() => setShowRateModal(true)} className={btnSecondary}>
                                    <Plus size={16} />
                                    Nova Taxa
                                </button>
                            </div>

                            {rates.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 border border-dashed border-gray-300 rounded-xl">
                                    <p>Nenhuma taxa cadastrada ainda</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {rates.map(rate => (
                                        <div key={rate.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg">{rate.year}</p>
                                                <p className="text-sm text-gray-500">Taxa: {rate.rate}</p>
                                            </div>
                                            <button onClick={() => handleDeleteRate(rate.id)} className={btnDanger}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {showPairModal && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-4 rounded-2xl">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                            <h3 className="font-bold mb-4">Criar Novo Par</h3>
                            <select value={newPairCurrency} onChange={(e) => setNewPairCurrency(e.target.value)} className={inputClass + " mb-4"}>
                                <option value="">Selecione uma moeda</option>
                                {availableCurrencies.map(c => (
                                    <option key={c.id} value={c.id}>{c.code} - {c.name} ({c.country_name})</option>
                                ))}
                            </select>
                            <div className="flex gap-3">
                                <button onClick={handleCreatePair} className={btnPrimary + " flex-1"}>Criar</button>
                                <button onClick={() => setShowPairModal(false)} className={btnSecondary}>Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}

                {showRateModal && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-4 rounded-2xl">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                            <h3 className="font-bold mb-4">Cadastrar Taxa</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ano</label>
                                    <input type="number" value={newRate.year} onChange={(e) => setNewRate({...newRate, year: e.target.value})} className={inputClass} min="1900" max="2100" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Taxa de Câmbio</label>
                                    <input type="number" step="0.000001" value={newRate.rate} onChange={(e) => setNewRate({...newRate, rate: e.target.value})} className={inputClass} placeholder="Ex: 5.25" />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button onClick={handleCreateRate} className={btnPrimary + " flex-1"}>Cadastrar</button>
                                <button onClick={() => setShowRateModal(false)} className={btnSecondary}>Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}