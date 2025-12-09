export async function POST(request) {
  try {
    // 获取请求体
    const body = await request.json();
    
    // RPC URL
    const rpcUrl = 'https://bnb64982.allnodes.me:8545/IwpJoG0VfynfiheV';
    
    // 转发请求到 RPC 节点
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // 获取响应数据
    const data = await response.json();
    
    // 返回响应
    return Response.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // 错误处理
    console.error('RPC Proxy Error:', error);
    return Response.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: error.message,
        },
        id: null,
      },
      { status: 500 }
    );
  }
}

// 可选：也支持 GET 请求（如果需要）
export async function GET(request) {
  return Response.json(
    {
      error: 'Method not allowed',
      message: 'RPC endpoint only accepts POST requests',
    },
    { status: 405 }
  );
}