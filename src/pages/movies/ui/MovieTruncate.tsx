import { Button } from "@chakra-ui/react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import toast from "react-hot-toast";

const fetchMovieTrunc = (movieLink: string) =>
    fetch('/api/truncMovie', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            movieLink
        })
    })
    .then((res) => res.json())

export const MovieTruncate: React.FC<{
    movieLink: string;
}> = ({ movieLink }) => {
    const [inProgress, setInProgress] = useState(false);

    const onStartTruncation = useCallback(() => {
        if (!inProgress) {
            setInProgress(true);

            fetchMovieTrunc(movieLink).then(() => {
                setInProgress(false);

                toast("Movie truncated!")
            });
        }
    }, [inProgress]);

    return <Button onClick={onStartTruncation} isLoading={inProgress} colorScheme='red'> 
        {inProgress ? 'processing...' : 'Truncate movie'}
    </Button>;
};