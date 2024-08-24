import { useEffect, useState } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getRemoteConfig, getValue } from "firebase/remote-config";
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Container from '@mui/material/Container';
import InputLabel from '@mui/material/InputLabel';
import ToggleButtonGroup from '@mui/joy/ToggleButtonGroup';
import Button from '@mui/joy/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { format, differenceInWeeks, Day, nextDay, differenceInDays, addWeeks } from "date-fns";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { CardContent, CardHeader } from '@mui/material';
import { enAU } from 'date-fns/locale';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { dayLookup, pRow, TitleCase } from "./util";
import { Person } from "./types";
import { expireStaleCreditData, pushChefData } from "./data"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmY414SUin3MCCcHBsrGuNm7qv-a_4Ghs",
  authDomain: "dnd-chef.firebaseapp.com",
  projectId: "dnd-chef",
  storageBucket: "dnd-chef.appspot.com",
  messagingSenderId: "252269096400",
  appId: "1:252269096400:web:3dc58696b2ed6629971dd5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const remoteConfig = getRemoteConfig(app);
remoteConfig.settings.minimumFetchIntervalMillis = 3600000;
export const db = getFirestore(app);


remoteConfig.defaultConfig = {
  "dnd_day": "tuesday"
};

function calculateChef(chefs: Person[], selectedDate: Date, offset: number): Person | undefined {
  if (chefs.length === 0) return
  let nCycles = differenceInWeeks(selectedDate, new Date())
  let offsetChefs = pRow(chefs, offset)
  const credit = new Map<string, number>(offsetChefs.map((p) => [p.name, p.credit]))
  let chosenChef: Person | undefined
  outer: while (nCycles >= 0) {
    for (let chef of offsetChefs) {
      const chefCredit = credit.get(chef.name)
      if (chefCredit && chefCredit > 0) {
        credit.set(chef.name, chefCredit - 1)
      }
      else {
        chosenChef = chef
        nCycles -= 1
        if (nCycles < 0) break outer
      }
    }
  }
  return chosenChef
}

function findNextChefOccurence(target: Person, chefs: Person[], offset: number): number | undefined {
  if (!chefs.map((p) => p.name).includes(target.name)) return
  let offsetChefs = pRow(chefs, offset)
  const credit = new Map<string, number>(chefs.map((p) => [p.name, p.credit]))
  let nWeeks = 0
  outerLoop: while (true) {
    for (let chef of offsetChefs) {
      const chefCredit = credit.get(chef.name)
      if (chefCredit && chefCredit > 0) {
        credit.set(chef.name, chefCredit - 1)
      }
      else {
        if (chef.name === target.name) {
          break outerLoop
        }
        nWeeks += 1
      }
    }
  }
  return nWeeks
}

function ChefDisplay({ chefName, day }: { chefName: string, day: Date }) {
  const date_str = format(day, "E - d/M/uu")
  return (
    <Card sx={{ width: 1 }}>
      <CardHeader title={`Next D&D session: ${date_str}`}></CardHeader>
      <CardContent>{`Chef: ${chefName}`}</CardContent>
    </Card>
  )
}

function DateSelector({ onSelect, defaultValue }: { onSelect: (value: Date | null) => void, defaultValue?: Date }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enAU}>
      <DatePicker sx={{ width: 1 }} label="Select date" value={defaultValue} onChange={onSelect} disablePast />
    </LocalizationProvider>
  )
}

function DaySelector({ defaultDay, handleSelect }: { defaultDay: string, handleSelect: (newDay: string) => void }) {
  const options = []

  for (let day of dayLookup.keys()) {
    options.push(<MenuItem key={day} value={day}>{TitleCase(day)}</MenuItem>)
  }

  const handleChange = (event: SelectChangeEvent) => {
    handleSelect(event.target.value);
  };

  return (
    <FormControl fullWidth>
      <InputLabel id="demo-simple-select-label">D&D day</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        label="D&D day"
        value={defaultDay}
        onChange={handleChange}
      >
        {options}
      </Select>
    </FormControl>)
}

function ChefControlGroup({ chefs, onFindNext, onChangeCredit }: { chefs: Person[], onFindNext: (selectedChef: Person) => void, onChangeCredit: (chef: Person, newCredit: number) => void }) {
  const [selectedChef, setSelectedChef] = useState<Person | null>();
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('md'));

  const handleSelect = (
    _event: React.MouseEvent<HTMLElement>,
    selectedChef: string | null,
  ) => {
    if (!selectedChef) return
    const idx = chefs.map((chef) => chef.name).indexOf(selectedChef)
    if (idx == -1) return
    const chef = chefs[idx]
    if (chef) {
      onFindNext(chef)
    }
    setSelectedChef(chef);
  };

  const groups = chefs ? chefs.map((chef) => <ChefControls chef={chef} onChangeCredit={onChangeCredit} />) : []
  return (
    <ToggleButtonGroup orientation={`${matches ? `horizontal` : `vertical`}`} value={selectedChef?.name} onChange={handleSelect} spacing={1} variant={"soft"}>{groups}</ToggleButtonGroup>
  )
}

function ChefControls({ chef, onChangeCredit }: { chef: Person, onChangeCredit: (chef: Person, newCredit: number) => void }) {
  return (
    <Stack spacing={1}>
      <Button key={chef.name} value={chef.name}>{TitleCase(chef.name)}</Button>
      <ChefCreditControls chef={chef} onChangeCredit={onChangeCredit}></ChefCreditControls>
    </Stack>)
}

function ChefCreditControls({ chef, onChangeCredit }: { chef: Person, onChangeCredit: (chef: Person, newCredit: number) => void }) {
  return (
    <Stack direction={"row"} spacing={1}>
      <ButtonGroup variant="text" aria-label="Basic button group">
        <IconButton aria-label={`add-credit-${chef.name}`} onClick={() => { onChangeCredit(chef, chef.credit + 1) }}>
          <AddCircleOutlineIcon />
        </IconButton>
        <IconButton aria-label={`remove-credit-${chef.name}`} onClick={() => { onChangeCredit(chef, chef.credit - 1) }}>
          <RemoveCircleOutlineIcon />
        </IconButton>
      </ButtonGroup>
      <TextField label="Extra credit" InputProps={{
        inputProps: { min: 0 }
      }} type="number" variant="standard" value={chef.credit} onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
        onChangeCredit(chef, parseInt(event.target.value));
      }}></TextField>
    </Stack>)
}

function App() {
  // addDefaultData(true)
  const initDate = new Date("2024-08-05T00:00:00+09:30")

  const [chefData, setChefData] = useState<Array<Person>>([]);
  const [selectedDnDDay, setSelectedDnDDay] = useState<string>("sunday");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // The date picked in the calendar

  function nextSessionFromDate(date: Date): Date {
    const nextSession = date.getDay() == dndDayOfWeek ? date : nextDay(date, dndDayOfWeek)
    return nextSession
  }

  useEffect(() => {
    async function fetchData() {
      const q = query(collection(db, "chefs"));
      const querySnapshot = await getDocs(q);
      const chefs: Person[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        console.log(data)
        const chef = { name: data.name, order: data.order, credit: data.credit, creditDate: data.creditDate ? data.creditDate.toDate() : null }
        chefs.push(chef)
      });
      chefs.sort((a, b) => a.order - b.order)
      expireStaleCreditData(chefs)
      setChefData(chefs)
    }
    fetchData()
  }, [])

  useEffect(() => {
    pushChefData(chefData)
  }, [chefData])

  useEffect(() => {
    const dndDayOfWeekStr = getValue(remoteConfig, "dnd_day").asString()
    setSelectedDnDDay(dndDayOfWeekStr)
  }, [])

  function onSelectDate(newDate: Date | null) {
    const today = new Date()
    newDate = newDate ? newDate : today
    if (differenceInDays(newDate, today) < 0) {
      newDate = today
    }
    setSelectedDate(newDate)
  }

  function onFindNextChef(chef: Person) {
    const nWeeks = findNextChefOccurence(chef, chefData, offset)
    if (!(nWeeks === undefined)) {
      setSelectedDate(addWeeks(nextSessionDayFromToday, nWeeks))
    }
  }

  function onChangeCredit(chef: Person, newCredit: number) {
    if (newCredit < 0) return
    const idx = chefData.indexOf(chef)
    if (idx == -1) return
    chef.credit = newCredit
    if (newCredit > 0) {
      chef.creditDate = new Date()
    }
    else {
      chef.creditDate = null
    }
    setChefData([...chefData.slice(0, idx), chef, ...chefData.slice(idx + 1)])
  }

  const dndDayOfWeek: Day = dayLookup.get(selectedDnDDay) ?? 0
  const nextSessionDayFromToday = nextSessionFromDate(new Date())
  const initDay = initDate.getDay() === dndDayOfWeek ? initDate : nextDay(initDate, dndDayOfWeek)
  const offset = chefData ? differenceInWeeks(nextSessionDayFromToday, initDay) % chefData.length : 0

  const nextSessionDayFromSelected = nextSessionFromDate(selectedDate)

  let selectedChef: Person | undefined
  selectedChef = calculateChef(chefData, nextSessionDayFromSelected, offset)
  const chefName = selectedChef ? selectedChef.name : "Unknown"

  return (
    <>
      <CssBaseline />
      <Container maxWidth="md">
        <Box display="flex" flexDirection="column" justifyContent="center" height="100vh">
          <Stack direction="column" spacing={2} justifyContent="center" alignItems="center">
            <ChefDisplay chefName={chefName} day={nextSessionDayFromSelected}></ChefDisplay>
            <DateSelector onSelect={onSelectDate} defaultValue={selectedDate}></DateSelector>
            <DaySelector defaultDay={selectedDnDDay} handleSelect={setSelectedDnDDay}></DaySelector>
            <ChefControlGroup chefs={chefData} onFindNext={onFindNextChef} onChangeCredit={onChangeCredit}></ChefControlGroup>
          </Stack>
        </Box>
      </Container>
    </>
  )
}

export default App
