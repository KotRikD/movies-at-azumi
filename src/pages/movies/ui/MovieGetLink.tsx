import { Button } from "@chakra-ui/react";
import { useCallback, useEffect, useReducer, useRef } from "react";
import toast from "react-hot-toast";

const fetchMovieLink = (movieLink: string, mkvAudioTrack?: number) =>
    fetch('/api/getMovieLink', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            movieLink,
            mkvAudioTrack
        })
    })
        .then((res) => res.json())
        .then((jsonObj) => {
            if (jsonObj.state === 'in_progress') {
                return new Promise((r) => setTimeout(r, 1000)).then(() =>
                    fetchMovieLink(movieLink)
                );
            }

            if (jsonObj.state === 'link') {
                return jsonObj.link;
            }

            throw new Error(
                'unknown state in getMovieLink resposne, maybe it failed?'
            );
        });

export const MovieGetLink: React.FC<{
    movieLink: string;
}> = ({ movieLink }) => {
    console.log(movieLink);

    const inProgressRef = useRef(false);
    const [buttonState, dispatch] = useReducer(
        (_, action) => {
            switch (action.type) {
                case 'in_progress':
                    return {
                        state: 'in_progress',
                        link: null
                    };
                case 'link':
                    return {
                        state: 'link',
                        link: action.link
                    };
                default:
                    throw Error('no action in reducer with that type');
            }
        },
        { state: 'not_init', link: null }
    );

    useEffect(() => {
        if (buttonState.state === 'in_progress' && !inProgressRef.current) {
            const mkvAudioTrack = movieLink.endsWith(".mkv") ? Number(prompt("Enter audio-track number for .mkv")) : undefined;
 
            fetchMovieLink(movieLink, mkvAudioTrack).then((link) => {
                dispatch({
                    type: 'link',
                    link
                });

                navigator.clipboard.writeText(link).then(() => {
                    toast('Link copied!');
                });

                inProgressRef.current = false;
            });
            inProgressRef.current = true;
        }
    }, [buttonState]);

    const onGetLink = useCallback(() => {
        if (buttonState.state === 'link') {
            navigator.clipboard.writeText(buttonState.link).then(() => {
                toast('Link copied!');
            });
            return;
        }

        dispatch({ type: 'in_progress' });
    }, [buttonState]);

    return <Button onClick={onGetLink} isLoading={buttonState.state === 'in_progress'}>
        {buttonState.state === 'in_progress' ? 'processing...' : 'Process movie'}
    </Button>;
};