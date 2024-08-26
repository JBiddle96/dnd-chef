import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { enAU } from 'date-fns/locale';
import { dayLookup, TitleCase } from "./util";

export function DateSelector({ onSelect, defaultValue }: { onSelect: (value: Date | null) => void, defaultValue?: Date }) {
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enAU}>
            <DatePicker sx={{ width: 1 }} label="Select date" value={defaultValue} onChange={onSelect} disablePast />
        </LocalizationProvider>
    )
}

export function DaySelector({ defaultDay, handleSelect }: { defaultDay: string, handleSelect: (newDay: string) => void }) {
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