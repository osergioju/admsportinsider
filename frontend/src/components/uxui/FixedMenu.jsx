import NotificationDropdown from "../notifications/NotificationDropdown"
import { Heart, Search, Cog } from "lucide-react";

export default function FixedMenu({ mode : mode }) {
  return (
    <div>
        
        {
            mode ? (
                <div className="fixed bottom-5 w-full left-0 z-40 lg:hidden">
                    <div className="w-max mx-auto p-4 bg-white/30 backdrop-blur border border-[#E9E9E9] shadow-xl w-full left-0 rounded-xl">
                        <div className="gap-2 flex items-center justify-between flex-wrap">
                            <NotificationDropdown />
                            <div className="text-center">
                                <button className="cursor-pointer transition-all group hover:bg-[#7F33D9] hover:border-[#7F33D9] border border-[#AFAFB2] rounded-full w-[36px] h-[36px] flex flex-col items-center justify-center">
                                    <Heart strokeWidth={1} className="text-[#7F33D9] group-hover:text-white transition-all w-[18px]"></Heart>
                                </button>
                            </div> 
                            <div className="text-center">
                                <button className="cursor-pointer transition-all group hover:bg-[#7F33D9] hover:border-[#7F33D9] border border-[#AFAFB2] rounded-full w-[36px] h-[36px] flex flex-col items-center justify-center">
                                    <Search strokeWidth={1} className="text-[#7F33D9] group-hover:text-white transition-all w-[18px]"></Search>
                                </button>
                            </div>
                            <div className="text-center">
                                <button className="cursor-pointer transition-all group hover:bg-[#7F33D9] hover:border-[#7F33D9] border border-[#AFAFB2] rounded-full w-[36px] h-[36px] flex flex-col items-center justify-center">
                                    <Cog strokeWidth={1} className="text-[#7F33D9] group-hover:text-white transition-all w-[18px]"></Cog>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ): (
                <div>
                    xxxxxxxx
                </div>
            )
        }
    </div>
  );
}
