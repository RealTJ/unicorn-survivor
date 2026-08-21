## Me
See local used ssh key, that also the Jetbrains IDE uses

## AI Assistant
To see which local SSH key JetBrains is using:

### 1. Check the Git executable and SSH setup

In the IDE, open:

<ActionButton id="ShowSettings" value="Version Control | Git"/>

Check **SSH executable**:

- **Native** — JetBrains uses your system `ssh` command and its normal SSH configuration/agent.
- **Built-in** — JetBrains uses its own SSH implementation and may use keys configured in the IDE.

For Git, JetBrains normally uses the SSH configuration associated with the selected Git executable.

### 2. Check the SSH key configured in JetBrains

Open:

<ActionButton id="ShowSettings" value="Tools | SSH Configurations"/>

Select the relevant configuration and inspect **Authentication type**:

- **Key pair (OpenSSH or PuTTY)** — the **Private key file** field shows the exact key path.
- **OpenSSH config and authentication agent** — JetBrains uses your SSH config and/or running `ssh-agent`; the key is not necessarily specified directly in the IDE. [[1]](https://www.jetbrains.com/help/webstorm/2025.2/create-ssh-configurations.html)

### 3. See keys currently loaded in your SSH agent

Run this in a terminal:

```shell script
ssh-add -l
```


To show public keys and their paths/fingerprints:

```shell script
ssh-add -L
```


If no keys are listed, add one:

```shell script
ssh-add ~/.ssh/id_ed25519
```


JetBrains documents `ssh-add -L` for listing keys used by the authentication agent. [[2]](https://www.jetbrains.com/help/webstorm/2025.2/configuring-ssh-and-ssl.html#create-the-ssh-tunnel-with-the-ssh-agent)

### 4. Find the key SSH would actually select

For a specific Git host, such as GitHub:

```shell script
ssh -vT git@github.com
```


Look for lines such as:

```plain text
Offering public key: /home/you/.ssh/id_ed25519
Server accepts key: /home/you/.ssh/id_ed25519
```


On macOS or Linux, you can also inspect the resolved SSH configuration:

```shell script
ssh -G git@github.com | grep -i identityfile
```


On Windows PowerShell:

```textmate
ssh -G git@github.com | Select-String identityfile
```


### 5. Check your SSH config

Inspect:

```plain text
~/.ssh/config
```


For example:

```
Host github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```


If the IDE uses **Native** SSH, this configuration is normally what determines the key. You can verify the exact behavior from the IDE terminal with:

```shell script
git config --show-origin --get core.sshCommand
git remote -v
```


If `core.sshCommand` is empty, Git generally uses the configured system SSH executable and `~/.ssh/config`.
