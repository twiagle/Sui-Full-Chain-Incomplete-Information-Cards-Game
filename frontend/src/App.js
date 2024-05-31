import "./App.css";
import "antd/dist/reset.css";
import Header from "./components/Header"
import { useCallback, useEffect, useState } from 'react';
import Room from './pages/Room';
import Home from './pages/Home';
import { SetLocationContext } from './utils/use-set-location';
import { SetRoleContext } from './utils/use-set-role';

const App = () => {
  const [location, setLocation] = useState(document.location.pathname);
  const [role, setRole] = useState(-1);

  const pushHistory = useCallback((location) => {
    window.history.pushState(null, null, location);
    setLocation(document.location.pathname);
  }, []);

  useEffect(() => {
    window.onpopstate = (event) => {
      setLocation(event.target.location.pathname);
    };
    return () => {
      window.onpopstate = null;
    };
  }, []);

  return (
    <SetLocationContext.Provider value={pushHistory}>
      <SetRoleContext.Provider value={{ role, setRole }}>
        <div className="App">
          <Header></Header>
          {location === '/' ? <Home /> : <Room />}
        </div>
      </SetRoleContext.Provider>
    </SetLocationContext.Provider>
  );
};


export default App;