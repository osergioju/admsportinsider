import { useState, useEffect } from "react";
import { api } from "../../services/api"; 
import { Trash2, Loader, Check } from "lucide-react";
// import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
//import paises from "world-countries";
import Select from  "../../components/ui/Select"

export default function GestaoPaises() {
    const [countries, setCountries] = useState([]);
    // const navigate = useNavigate();
    const [modal, setModal] = useState(false);
    const [paisSelecionado, setpaisSelecionado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [editCounty, setEditCountry] = useState(null);
    const [currentCountry, setCurrentCountry] = useState(null);

    // Use effect 
    useEffect(() => {
        async function loadCountries() {
          try {
            const { data } = await api.get("/admin/countries");
            setCountries(data.countries);
          } catch (err) {
            console.error("Erro ao carregar países:", err);
          }
        }
        loadCountries();
    }, []);

    // Constante pra ir para a página de edição do país 
    const handleEditCountry = async (countryId) =>  {
        setEditCountry(countryId);
        setModal(true);

        // Pega o país pelo id
        try {
            const { data } = await api.get("/admin/countries/" + countryId);
            setCurrentCountry(data.countries[0]);
        } catch (err) {
            console.error("Erro ao carregar países:", err);
        }
    };

    // Abrir modal 
    const handleOpenModal = () => {
        setModal(true);
    };

    // Pegaos valores do país 
    const handleChange = (e) => {
        const option = e.target.selectedOptions[0];
        setpaisSelecionado({
            codigo: option.value,
            flag: option.dataset.flag,
            value : option.dataset.name
        });
    };

    const sendCountry = async () => {
        // Seta o loading 
        setLoading(true);
        
        try {
            const res = await api.post("/admin/send-countries", paisSelecionado);

            if (res.status === 201) {
                // Timeout 
                setTimeout(() => {
                    setLoading(false);
                    setSuccess(true);

                    // Timeout pra tirar o modal 
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }, 1000);                
            } else {
                alert("Erro ao cadastrar país.");
            }

        } catch (error) {
            console.error("Erro ao enviar país:", error);
            alert("Erro ao cadastrar país. Verifique os dados e tente novamente.");
        }
    };

   const deleteCountry = async (countryId) => {
        // Da um alerta, se ok segue 
        if (!window.confirm("Tem certeza que deseja deletar o país?")) {
            return;
        }

        try {
            const res = await api.delete(`/admin/delete-country/${countryId}`);
            console.log(res);

            if (res.status === 200) {
                alert("País deletado com sucesso!");
                window.location.reload();
            } else {
                alert("Erro ao deletar país.");
            }

        } catch (error) {
            console.error("Erro ao enviar país:", error);
            alert("Erro ao cadastrar país. Verifique os dados e tente novamente.");
        }
    };

    return (
        <div>
            <div className="pb-2 mb-2 border-b border-[#e5e7eb] flex flex-wrap justify-between items-center w-full mb-4">
                <h1 className='font-bold text-2xl'>Países</h1>
                {countries.length > 0 && (
                    <div>
                        <button
                        onClick={handleOpenModal}
                        className="bg-blue-600 text-white px-4 py-2 inline-block rounded-xl hover:bg-blue-700 cursor-pointer">Cadastrar países</button>
                    </div>
                )}
            </div>
            <div className='p-4 bg-white rounded-3xl w-full'>
                {countries.length > 0 ? (
                  <ul>
                      {countries.map((country) => (
                          <div 
                              onClick={() => handleEditCountry(country.id_country)} 
                              className="cursor-pointer hover:bg-[#e5e7eb] group mb-2 bg-[#f3f4f6] p-3 rounded-xl flex justify-between align-center"
                              key={country.id_country}
                          >
                              <div className="flex items-center gap-2">
                                  <img
                                      className="w-10"
                                      src={country.flag_url ? country.flag_url : "https://flagcdn.com/w40/br.png"}
                                      alt=""
                                  />
                                  <span>{country.name}</span>
                              </div>
                              <div className="flex items-center mr-5">
                                  <Trash2 className="group-hover:opacity-100 opacity-0 transition-all w-4 ml-4 cursor-pointer text-[#222222]" />
                              </div>
                          </div>
                      ))}
                  </ul>
              ) : (
                  <div className="text-center py-6">
                      <p className="text-gray-500 mb-3">Nenhum país cadastrado ainda</p>
                      <button
                        onClick={handleOpenModal}
                        className="bg-blue-600 text-white px-4 py-2 inline-block rounded-xl hover:bg-blue-700 cursor-pointer">Cadastrar países</button>
                  </div>
              )}

            </div>
            {modal && (
                <div
                    className="fixed inset-0 bg-[#222222b1] flex items-center justify-center z-50 animate-fadeIn"
                    onClick={() => {
                        setModal(false);
                        setEditCountry(null);
                    }}
                >
                    <div
                        className="w-full p-8 bg-white rounded-3xl max-w-3xl animate-scaleIn"
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <div className="flex justify-end">
                            <button
                                className="cursor-pointer text-xl font-bold text-gray-500 hover:text-gray-800"
                                onClick={() => {
                                    setModal(false);
                                    setEditCountry(null);
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* conteúdo */}
                        { editCounty && currentCountry ? (
                            <div>
                                <h2 className="text-xl font-bold mb-2">Excluir <span className="bg-[#222222] px-2 text-white ">{currentCountry.name}</span> da lista de países?</h2>
                                <button 
                                    onClick={() => {
                                        deleteCountry(currentCountry.id_country)
                                    }}
                                    className="hover:text-[#53083d] transition-all cursor-pointer underline rounded-xl p-0 text-left text-lg">Sim, excluir</button>
                                </div>
                        ) : (
                            <div>
                                <Select
                                    onChange={handleChange}
                                    label="Selecione um país"
                                    labelColor="text-gray-500"
                                    variant="light"
                                    options={paises}
                                ></Select>

                                { 
                                    paisSelecionado ? (
                                        <div className="flex items-center justify-between">
                                            <div className="p-3 flex flex-wrap text-left items-center">
                                                <div className="relative rounded-xl overflow-hidden">
                                                    <img src={paisSelecionado.flag} alt="" className="w-30" />
                                                    { (loading || success) && (
                                                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-[#2222226c]">
                                                            { loading && <Loader className="animate-spin text-white" /> }
                                                            { success && <Check className="text-white" /> }
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col  ml-3">
                                                    <span className="font-bold text-2xl mb-3">{paisSelecionado.value}</span>
                                                    <button 
                                                        onClick={sendCountry}
                                                        className="hover:text-[#11398a] transition-all cursor-pointer underline rounded-xl p-0 text-left">cadastrar</button>
                                                </div>
                                            </div>
                                        </div>
                                    ): (
                                        <div>
                                            Selecione um país
                                        </div>
                                    )
                                }
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}