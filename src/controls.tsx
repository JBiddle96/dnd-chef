import { useState } from "react";
import ToggleButtonGroup from '@mui/joy/ToggleButtonGroup';
import Button from '@mui/joy/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import { TitleCase } from "./util";
import { Person } from "./types";

export default function ChefControlGroup({ chefs, onFindNext, onChangeCredit }: { chefs: Person[], onFindNext: (selectedChef: Person) => void, onChangeCredit: (chef: Person, newCredit: number) => void }) {
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

    const groups = chefs ? chefs.map((chef) => <ChefControls key={`controls-${chef.name}`} chef={chef} onChangeCredit={onChangeCredit} />) : []
    return (
        <ToggleButtonGroup orientation={`${matches ? `horizontal` : `vertical`}`} value={selectedChef?.name} onChange={handleSelect} spacing={1} variant={"soft"}>
            {groups}
        </ToggleButtonGroup>
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
            }} type="number" variant="standard" value={chef.credit}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    if (event.target.value) {
                        onChangeCredit(chef, parseInt(event.target.value))
                    }
                    else {
                        onChangeCredit(chef, 0)
                    }
                }} />
        </Stack>)
}
