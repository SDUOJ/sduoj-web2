import {MTableAction} from "../Action/MTable";

interface MTableState {
    Data: []
    SelectedRow: []
}

const initState: MTableState = {
    Data: [], SelectedRow: []
}

// export const MTableCalculate = (state: MTableState = initState, action: MTableAction) => {
//     switch (action.type) {
//         case "Data":
//             state.Data = action.
//             return
//         case "ChoiceRow":
//             return {num: state.num - action.count}
//         default:
//             return state
//     }
// }