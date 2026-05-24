/**
 * Zapia Bridge Service
 * Sincroniza o estado do app com o Zapia via GitHub Gist
 */
import axios from 'axios';

const GIST_ID = '5e87d051c220067fbe895bddbe88de1c';

class ZapiaBridgeService {
  private githubToken: string = '';

  setToken(token: string) {
    this.githubToken = token;
  }

  async syncState(state: any) {
    if (!this.githubToken) return;

    try {
      await axios.patch(`https://api.github.com/gists/${GIST_ID}`, {
        files: {
          'status.json': {
            content: JSON.stringify({
              ...state,
              lastSync: new Date().toISOString(),
            }, null, 2)
          }
        }
      }, {
        headers: {
          Authorization: `Bearer ${this.githubToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      console.log('[ZapiaBridge] Estado sincronizado');
    } catch (error: any) {
      console.error('[ZapiaBridge] Erro ao sincronizar:', error?.message);
    }
  }

  async getCommands(): Promise<string[]> {
    if (!this.githubToken) return [];

    try {
      const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          Authorization: `Bearer ${this.githubToken}`
        }
      });
      const commandsFile = response.data.files['commands.json'];
      if (commandsFile && commandsFile.content) {
        const data = JSON.parse(commandsFile.content);
        return data.commands || [];
      }
    } catch (error) {
      // Silencioso
    }
    return [];
  }
}

export const zapiaBridge = new ZapiaBridgeService();
