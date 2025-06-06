#!/usr/bin/env python3
import subprocess
import sys
import os

def main():
    """Inicia o servidor do site Replit com facilidade"""
    try:
        # Define o diretório de trabalho como o diretório do script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)
        
        print("================================================")
        print("🚀 INICIANDO SERVIDOR AURALIS EM MODO DEMO")
        print("================================================")
        print("")
        print("✅ Use qualquer login, por exemplo:")
        print("   - admin/admin")
        print("   - user/user")
        print("   - ou qualquer combinação!")
        print("")
        print("URL: http://localhost:5000")
        print("================================================")
        print("")
        
        # Define variáveis de ambiente para modo demo
        env = os.environ.copy()
        env['DEMO_MODE'] = 'true'
        env['SESSION_SECRET'] = 'auraliscommunication'
        env['NODE_ENV'] = 'development'
        
        # Executa npm run dev com as variáveis de ambiente
        subprocess.run(["npm", "run", "dev"], check=True, env=env)
        
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Erro ao executar o servidor: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Servidor interrompido pelo usuário")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()