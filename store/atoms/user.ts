import { atom } from "recoil";

export type User = {
  userName: string;
  roomName: string;
};

// const userSelector = selector({
//   key: "userSelector",
//   get: {
//     userName: "",
//     roomName: "",
//   },
// });

export const userAtom = atom<User>({
  key: "userAtom",
  default: {
    userName: "Vaibhav",
    roomName: "2",
  },
});
