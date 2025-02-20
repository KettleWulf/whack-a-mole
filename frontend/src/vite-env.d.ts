/// <reference types="vite/client" />

// Add typing of VITE_SOCKET_HOST to the global import.meta.env object
interface ImportMetaEnv {
	VITE_SOCKET_HOST: string;
}
