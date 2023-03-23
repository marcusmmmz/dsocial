<script lang="ts">
	let chatId = "";
</script>

<div class="background">
	<div class="container">
		<h2>Create chat</h2>
		<label>
			Chat id
			<input type="text" bind:value={chatId} />
		</label>
		<a href="/chats/{chatId}"><button>Create</button></a>

		<hr />

		<h2>Join chat</h2>
		<label>
			Chat id
			<input type="text" bind:value={chatId} />
		</label>
		<a href="/chats/{chatId}"><button>Join</button></a>
	</div>
</div>

<style>
	.background {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background-color: #38343c;
		width: 100%;
	}

	.container {
		display: flex;
		flex-direction: column;
		gap: 4px;
		/* align-items: center; */
		text-align: center;
		width: 50%;
	}

	label {
		display: flex;
		flex-direction: column;
		justify-content: stretch;
		text-align: start;
	}

	a {
		margin-top: 16px;
	}

	hr {
		width: 100%;
		margin: 16px 0;
	}
</style>
