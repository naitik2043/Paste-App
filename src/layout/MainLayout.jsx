import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950 transition-colors duration-300">

      <Navbar />

      <main className="flex-grow w-full">
        <div className="max-w-[1200px] mx-auto px-5 py-10 text-black dark:text-white">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;