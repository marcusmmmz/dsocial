<script lang="ts">
	let dmId = "";
</script>

<div class="background">
	<div class="container">
		<h2>Join DM</h2>
		<label>
			User id (nprofile)
			<input type="text" bind:value={dmId} />
		</label>
		<a href="/dms/{dmId}"><button>Join</button></a>
	</div>
</div>

<style>
	.background {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background-color: #303339;
		width: 100%;
	}
	.container {
		display: flex;
		flex-direction: column;
		gap: 4px;
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
		align-self: center;
	}
</style>
