import React from 'react';

import './App.css';
import 'antd/dist/antd.css';
import './Config/i18n'
import UserListOperHeader from "./Component/user/UserListOperHeader";
import MLayout from "./Component/common/MLayout";


function App() {

    return (
        <>
            <MLayout id={1} roles={[2]}/>
        </>
    );
}

export default App;
