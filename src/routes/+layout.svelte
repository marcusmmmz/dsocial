<div class="main">
	<div class="side-bar">
		<img src="https://cdn.discordapp.com/emojis/1048253883039875122.png" alt="pexe" />
		<a href="/chats"><button>rooms</button></a>
		<a href="/dms"><button>DMs</button></a>
	</div>

	<slot />
</div>

<style>
	:global(body, html) {
		height: 100%;
		width: 100vw;
		margin: 0;
	}
	.main {
		display: flex;
		height: 100%;
		width: 100vw;
		color: white;
		font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
	}
	.side-bar {
		background-color: #1f1f23;
	}
	.side-bar button {
		display: block;
		width: 64px;
	}
	.side-bar img {
		width: 64px;
		height: 64px;
	}
</style>
