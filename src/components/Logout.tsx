
import Icon from "./Icon";

const Logout : React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  return (
    <button
      className="w-10 h-10 p-1 rounded-full flex flex-row justify-center items-center hover:bg-gray-100 dark:hover:bg-zinc-700"
      onClick={() => {
        localStorage.removeItem("token");
        onLogout();
      }}
    >
      <Icon.FiLogOut className="text-gray-600 dark:text-gray-300 w-6 h-auto" />
    </button>
  );
};

export default Logout;