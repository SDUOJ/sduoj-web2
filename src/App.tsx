import React from 'react';

import './App.css';
import 'antd/dist/antd.css';
import './Config/i18n'
import UserListOperHeader from "./Component/user/UserListOperHeader";
import MLayout from "./Component/common/MLayout";
import UserInfo from "./Component/user/UserInfo";



function App() {
    return (
        <>
            <MLayout id={0} roles={[0]}/>
        </>
    );
}

export default App;
